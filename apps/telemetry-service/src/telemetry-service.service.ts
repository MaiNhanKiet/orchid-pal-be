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
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import { GoogleGenAI } from '@google/genai';
import { Telemetry, TelemetryDocument } from './schemas/telemetry.schema';

@Injectable()
export class TelemetryServiceService {
  constructor(
    @InjectModel(Telemetry.name)
    private readonly telemetryModel: Model<TelemetryDocument>,
    @Inject('API_GATEWAY') private readonly rmqClient: ClientProxy,
    private readonly prismaService: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) { }

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

    this.rmqClient.emit('telemetry_created_event', {
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
    const zone = await this.prismaService.planting_zones.findUnique({
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
      throw new NotFoundException('Không tìm thấy automation rule đang active cho zone này.');
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
        exposure: zone.exposure,
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
    const zone = await this.prismaService.planting_zones.findUnique({
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
      throw new NotFoundException('Không tìm thấy automation rule đang active cho zone này.');
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
        exposure: zone.exposure,
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
        throw new ServiceUnavailableException('Tính năng AI đang xảy ra lỗi. Vui lòng thử lại sau.');
      }

      aiData = JSON.parse(responseText);
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
