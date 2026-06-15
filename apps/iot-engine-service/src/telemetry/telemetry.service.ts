import { PrismaService } from '@app/prisma';
import { HttpService } from '@nestjs/axios';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { GoogleGenAI } from '@google/genai';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { Message, MessageDocument } from '../schemas/message.telemetry';
import { Telemetry, TelemetryDocument } from '../schemas/telemetry.schema';

@Injectable()
export class TelemetryService {
  constructor(
    @InjectModel(Telemetry.name)
    private readonly telemetryModel: Model<TelemetryDocument>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
    @Inject('API_GATEWAY') private readonly apiGatewayClient: ClientProxy,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

  private readonly orchidPalSystemInstruction = `
    - Giới hạn: Bạn CHỈ trả lời các câu hỏi liên quan đến Hoa Lan, chăm sóc cây, nông nghiệp công nghệ cao và hệ thống OrchidPal.

    - Nếu người dùng hỏi về chủ đề KHÔNG liên quan:
      + KHÔNG trả lời trực tiếp nội dung đó.
      + Hãy từ chối một cách LỊCH SỰ, TINH TẾ và THÂN THIỆN.
      + Sau đó KHÉO LÉO điều hướng lại cuộc trò chuyện về chủ đề Hoa Lan.

    - Cách từ chối:
      + Không nói "tôi không biết"
      + Không nói "không liên quan" một cách khô khan
      + Thay vào đó:
        * Thừa nhận câu hỏi
        * Nhẹ nhàng từ chối
        * Gợi ý quay lại chủ đề lan

    - Ví dụ:
      Người dùng: "Hôm nay thời tiết thế nào?"
      → Trả lời:
      "Mình tập trung hỗ trợ bạn về việc chăm sóc hoa lan và hệ thống OrchidPal 🌱. Nếu bạn cần tư vấn về tình trạng cây hoặc môi trường trồng lan, mình luôn sẵn sàng hỗ trợ nhé!"

      Người dùng: "Viết code giúp tôi"
      → Trả lời:
      "Mình chuyên hỗ trợ về hoa lan và hệ thống chăm sóc cây thông minh. Nếu bạn đang gặp vấn đề với cây lan hoặc muốn tối ưu môi trường trồng, mình có thể giúp bạn rất chi tiết 🌿"

      Người dùng: "Kể chuyện cười đi"
      → Trả lời:
      "Nghe cũng thú vị đó 😄, nhưng mình được thiết kế để đồng hành cùng bạn trong việc chăm sóc hoa lan. Nếu cây lan của bạn đang gặp vấn đề hoặc cần tư vấn, mình luôn sẵn sàng!"
  `;

  private sanitizeGeminiJson(text: string): any {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  }

  private async uploadChatImageToCloudinary(image: {
    base64: string;
    mimeType?: string;
    originalName?: string;
  }) {
    const cloudinary = require('cloudinary').v2;

    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    const uploadResult = await cloudinary.uploader.upload(
      `data:${image.mimeType || 'image/jpeg'};base64,${image.base64}`,
      {
        folder: 'orchidpal/chat',
        resource_type: 'image',
        public_id: image.originalName
          ? `${Date.now()}-${image.originalName.replace(/\.[^/.]+$/, '')}`
          : undefined,
        transformation: [
          { width: 1600, crop: 'limit' },
          { quality: 'auto:good' },
        ],
      },
    );

    return {
      type: 'image' as const,
      url: uploadResult.secure_url,
      mimeType: image.mimeType || 'image/jpeg',
    };
  }

  private async getRecentChatContext(
    sessionId: string,
    userId: string,
    limit = 14,
  ) {
    const history = await this.messageModel
      .find({ sessionId, userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return history.reverse();
  }

  async orchidChat(payload: {
    sessionId: string;
    userId: string;
    content: string;
    image?: {
      base64: string;
      mimeType?: string;
      originalName?: string;
    };
  }) {
    const geminiModel = this.configService.get<string>('GEMINI_MODEL');
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!geminiModel) {
      throw new ServiceUnavailableException('Thiếu cấu hình GEMINI_MODEL');
    }

    if (!geminiApiKey) {
      throw new ServiceUnavailableException('Thiếu cấu hình GEMINI_API_KEY');
    }

    const uploadedAttachment = payload.image
      ? await this.uploadChatImageToCloudinary(payload.image)
      : null;

    const attachments = uploadedAttachment ? [uploadedAttachment] : [];

    const userMessage = await this.messageModel.create({
      sessionId: payload.sessionId,
      userId: payload.userId,
      role: 'user',
      content: payload.content,
      attachments,
      metadata: { model: geminiModel },
    });

    const contextHistory = await this.getRecentChatContext(
      payload.sessionId,
      payload.userId,
    );

    const contextText = contextHistory
      .map((item) => {
        const imageUrls = (item.attachments || []).map((f) => f.url).join(', ');
        return `[${item.role}] ${item.content}${imageUrls ? ` | images: ${imageUrls}` : ''}`;
      })
      .join('\n');

    const textParts: Array<{ text: string }> = [
      {
        text: [
          this.orchidPalSystemInstruction,
          'Ngữ cảnh lịch sử hội thoại gần đây:',
          contextText || '(Không có)',
          'Tin nhắn hiện tại của người dùng:',
          payload.content,
        ].join('\n\n'),
      },
    ];

    const imageParts = attachments.map((file) => ({
      fileData: {
        fileUri: file.url,
        mimeType: file.mimeType || 'image/jpeg',
      },
    }));

    const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

    let answerText = '';
    try {
      const response = await genAI.models.generateContent({
        model: geminiModel,
        contents: [
          {
            role: 'user',
            parts: [...textParts, ...imageParts],
          },
        ],
      });

      answerText = response.text || '';
    } catch (error) {
      throw new ServiceUnavailableException(
        `Tính năng AI đang xảy ra lỗi. Vui lòng thử lại sau: ${error?.message || 'Unknown error'}`,
      );
    }

    if (!answerText) {
      throw new ServiceUnavailableException(
        'Tính năng AI đang xảy ra lỗi. Vui lòng thử lại sau.',
      );
    }

    const modelMessage = await this.messageModel.create({
      sessionId: payload.sessionId,
      userId: payload.userId,
      role: 'model',
      content: answerText,
      attachments: [],
      metadata: {
        model: geminiModel,
        tokens: answerText.length,
      },
    });

    return {
      sessionId: payload.sessionId,
      reply: modelMessage.content,
      userMessageId: userMessage._id,
      modelMessageId: modelMessage._id,
    };
  }

  async saveTelemetryData(serialNumber: string, payload: any) {
    const temperature = payload.temp !== undefined ? Number(payload.temp) : null;
    const humidity = payload.humid !== undefined ? Number(payload.humid) : null;
    const soil_moisture =
      payload.soil !== undefined ? Number(payload.soil) : null;
    const light = payload.light !== undefined ? Number(payload.light) : null;

    const savedData = await this.telemetryModel.create({
      timestamp: new Date(),
      metadata: { serial_number: serialNumber },
      temperature,
      humidity,
      soil_moisture,
      light,
    });

    this.apiGatewayClient.emit('telemetry_created_event', {
      serialNumber,
      timestamp: savedData.timestamp,
      sensors: {
        temp: temperature,
        humid: humidity,
        soil: soil_moisture,
        light,
      },
    });

    return savedData;
  }

  async getLatestTelemetry(serialNumber: string) {
    return this.telemetryModel
      .findOne({ 'metadata.serial_number': serialNumber })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getHistoryTelemetry(serialNumber: string, hours: number = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    return this.telemetryModel
      .find({
        'metadata.serial_number': serialNumber,
        timestamp: { $gte: startTime },
      })
      .sort({ timestamp: 1 })
      .select('timestamp temperature humidity soil_moisture light -_id')
      .exec();
  }

  async analyzeSeasonalConfig(zoneId: string, days: number = 3) {
    const zone = await this.prismaService.balcony_zones.findUnique({
      where: { id: zoneId },
      include: { devices: { select: { serial_number: true } } },
    });

    if (!zone) {
      throw new NotFoundException('Zone not found');
    }

    if (!zone.devices?.length) {
      throw new BadRequestException('No devices found in zone');
    }

    const serialNumber = zone.devices[0].serial_number;
    const history = await this.getHistoryTelemetry(serialNumber, days * 24);

    let totalTemp = 0;
    let totalHumid = 0;
    let count = 0;

    for (const record of history) {
      if (record.temperature != null && record.humidity != null) {
        totalTemp += Number(record.temperature);
        totalHumid += Number(record.humidity);
        count++;
      }
    }

    if (count === 0) {
      throw new BadRequestException('Không có dữ liệu telemetry hợp lệ để phân tích.');
    }

    const avgTemp = totalTemp / count;
    const avgHumid = totalHumid / count;

    const apiUrl = this.configService.get<string>('AI_PLATFORM_URL');
    const apiKey = this.configService.get<string>('AI_PLATFORM_KEY');

    if (!apiUrl) {
      throw new ServiceUnavailableException('Thiếu cấu hình AI_PLATFORM_URL');
    }

    const activeRule = await this.prismaService.automation_rules.findFirst({
      where: {
        zone_id: zoneId,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        logic_config: true,
      },
    });

    if (!activeRule) {
      throw new NotFoundException(
        'Không tìm thấy automation rule đang active cho zone này.',
      );
    }

    const currentLogicConfig =
      (activeRule.logic_config as any)?.logic_config ?? activeRule.logic_config;

    if (!Array.isArray(currentLogicConfig)) {
      throw new BadRequestException('logic_config trong DB không đúng định dạng mảng.');
    }

    const payloadToAi = {
      zone_id: zoneId,
      zone: {
        id: zone.id,
        name: zone.name,
        location_city: zone.location_city,
        sunlight_intensity: zone.sunlight_intensity,
        device_count: 1,
        devices: [serialNumber],
      },
      automation_rule: {
        id: activeRule.id,
        logic_config: currentLogicConfig,
      },
      telemetry_summary: {
        period_days: days,
        average_temperature: Number(avgTemp.toFixed(2)),
        average_humidity: Number(avgHumid.toFixed(2)),
        sample_count: count,
      },
    };

    const response = await firstValueFrom(
      this.httpService.post(
        apiUrl,
        {
          zoneId,
          context: payloadToAi,
          expected_output_format: {
            logic_config: [
              {
                if: {
                  metric: 'humidity',
                  op: '<',
                  value: 40,
                },
                then: {
                  action: 'pump',
                  duration_ms: 10000,
                },
              },
            ],
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { 'x-api-key': apiKey } : {}),
          },
          validateStatus: () => true,
        },
      ),
    );

    const result = response.data;

    if (response.status >= 400) {
      throw new ServiceUnavailableException(
        result?.message || 'AI Platform đang bận hoặc lỗi.',
      );
    }

    if (result?.status !== 'success' || !result?.data) {
      throw new ServiceUnavailableException(
        result?.message || 'AI Platform trả về dữ liệu không hợp lệ.',
      );
    }

    const aiData = result.data;
    const suggestedLogicConfig = aiData?.logic_config;

    if (!Array.isArray(suggestedLogicConfig)) {
      throw new ServiceUnavailableException(
        'AI Platform trả về logic_config không đúng định dạng mảng.',
      );
    }

    return {
      original: {
        logic_config: currentLogicConfig,
      },
      suggestion: {
        logic_config: suggestedLogicConfig,
      },
      analysis: {
        period: `${days} ngày`,
        average_temperature: avgTemp,
        average_humidity: avgHumid,
        zone_name: zone.name,
        ai_note: aiData?.ai_reason || 'AI đã điều chỉnh cấu hình theo mùa vụ.',
      },
    };
  }

  async geminianalyzeSeasonalConfig(zoneId: string, days: number = 3) {
    const zone = await this.prismaService.balcony_zones.findUnique({
      where: { id: zoneId },
      include: { devices: { select: { serial_number: true } } },
    });

    if (!zone) {
      throw new NotFoundException('Zone not found');
    }

    if (!zone.devices?.length) {
      throw new BadRequestException('No devices found in zone');
    }

    const serialNumber = zone.devices[0].serial_number;
    const history = await this.getHistoryTelemetry(serialNumber, days * 24);
    let totalTemp = 0;
    let totalHumid = 0;
    let count = 0;

    for (const record of history) {
      if (record.temperature != null && record.humidity != null) {
        totalTemp += Number(record.temperature);
        totalHumid += Number(record.humidity);
        count++;
      }
    }

    if (count === 0) {
      throw new BadRequestException('Không có dữ liệu telemetry hợp lệ để phân tích.');
    }

    const avgTemp = totalTemp / count;
    const avgHumid = totalHumid / count;

    const geminiModel = this.configService.get<string>('GEMINI_MODEL');
    const geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!geminiModel) {
      throw new ServiceUnavailableException('Thiếu cấu hình GEMINI_MODEL');
    }

    if (!geminiApiKey) {
      throw new ServiceUnavailableException('Thiếu cấu hình GEMINI_API_KEY');
    }

    const activeRule = await this.prismaService.automation_rules.findFirst({
      where: {
        zone_id: zoneId,
        is_active: true,
      },
      orderBy: {
        created_at: 'desc',
      },
      select: {
        id: true,
        logic_config: true,
      },
    });

    if (!activeRule) {
      throw new NotFoundException(
        'Không tìm thấy automation rule đang active cho zone này.',
      );
    }

    const currentLogicConfig =
      (activeRule.logic_config as any)?.logic_config ?? activeRule.logic_config;

    if (!Array.isArray(currentLogicConfig)) {
      throw new BadRequestException('logic_config trong DB không đúng định dạng mảng.');
    }

    const payloadToAi = {
      zone_id: zoneId,
      zone: {
        id: zone.id,
        name: zone.name,
        location_city: zone.location_city,
        sunlight_intensity: zone.sunlight_intensity,
        device_count: 1,
        devices: [serialNumber],
      },
      automation_rule: {
        id: activeRule.id,
        logic_config: currentLogicConfig,
      },
      telemetry_summary: {
        period_days: days,
        average_temperature: Number(avgTemp.toFixed(2)),
        average_humidity: Number(avgHumid.toFixed(2)),
        sample_count: count,
      },
    };

    const genAI = new GoogleGenAI({ apiKey: geminiApiKey });

    const prompt = [
      'Bạn là AI Kỹ sư Nông nghiệp cốt lõi của hệ thống OrchidPal.',
      'Nhiệm vụ: Phân tích dữ liệu môi trường trong Payload và tinh chỉnh lại mảng "logic_config" để bảo vệ hoa Lan.',

      'QUY TẮC BẮT BUỘC (TUÂN THỦ 100%):',
      '1. BẢO TOÀN THIẾT BỊ: Payload đầu vào có bao nhiêu object trong mảng logic_config, đầu ra BẮT BUỘC phải có chính xác bấy nhiêu object. Tuyệt đối KHÔNG thêm, KHÔNG bớt thiết bị.',
      '2. BẢO TOÀN CẤU TRÚC: Giữ nguyên các giá trị "action", "metric" và "op" của từng object.',
      '3. CHỈ ĐIỀU CHỈNH SỐ: Bạn chỉ được phép phân tích và thay đổi các con số ở trường "value" (ngưỡng kích hoạt) và "duration_ms" (thời gian chạy) sao cho phù hợp với thời tiết.',
      '4. KHÔNG RÁC: Chỉ trả về JSON thuần túy, tuyệt đối KHÔNG có thẻ markdown (```json), KHÔNG comment (//) bên trong JSON.',

      'Định dạng xuất ra bắt buộc:',
      JSON.stringify(
        {
          logic_config: [
            {
              if: {
                metric: 'humidity',
                op: '<',
                value: 40,
              },
              then: {
                action: 'pump',
                duration_ms: 10000,
              },
            },
          ],
          ai_reason: 'string',
        },
        null,
        2,
      ),
      'Dữ liệu đầu vào:',
      JSON.stringify(payloadToAi),
    ].join('\n\n');

    let aiData: any;

    try {
      const response = await genAI.models.generateContent({
        model: geminiModel,
        contents: prompt,
      });

      const responseText = response.text;

      if (!responseText) {
        throw new ServiceUnavailableException(
          'Tính năng AI đang xảy ra lỗi. Vui lòng thử lại sau.',
        );
      }

      aiData = this.sanitizeGeminiJson(responseText);
    } catch (error) {
      throw new ServiceUnavailableException(
        `Tính năng AI đang xảy ra lỗi. Vui lòng thử lại sau: ${error?.message || 'Unknown error'}`,
      );
    }

    const suggestedLogicConfig = aiData?.logic_config;

    if (!Array.isArray(suggestedLogicConfig)) {
      throw new ServiceUnavailableException(
        'Tính năng AI đang xảy ra lỗi. Vui lòng thử lại sau.',
      );
    }

    return {
      original: {
        logic_config: currentLogicConfig,
      },
      suggestion: {
        logic_config: suggestedLogicConfig,
      },
      analysis: {
        period: `${days} ngày`,
        average_temperature: avgTemp,
        average_humidity: avgHumid,
        zone_name: zone.name,
        ai_note: aiData?.ai_reason || 'AI đã điều chỉnh cấu hình theo mùa vụ.',
      },
    };
  }
}
