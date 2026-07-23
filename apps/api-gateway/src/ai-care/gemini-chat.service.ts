import { GoogleGenAI } from '@google/genai';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeminiChatTurn {
  role: 'user' | 'model';
  content: string;
  image_url?: string | null;
}

@Injectable()
export class GeminiChatService {
  constructor(private readonly config: ConfigService) {}

  private readonly systemPrompt = `Bạn là PlantAI Assistant của OrchidPal — trợ lý chăm sóc cây thông minh.
Nhiệm vụ: tư vấn tưới nước, ánh sáng, độ ẩm, phân bón, sâu bệnh, và chăm sóc lan hồ điệp / cây cảnh.
- Trả lời ngắn gọn, thực tế, dễ làm theo; dùng bullet khi cần.
- Nếu có ảnh cây, mô tả những gì quan sát được và đề xuất bước tiếp theo.
- Không chẩn đoán y khoa; khuyến khích liên hệ chuyên gia nếu tình trạng nghiêm trọng.
- Ưu tiên tiếng Việt nếu người dùng viết tiếng Việt; ngược lại dùng tiếng Anh.`;

  async generateReply(params: {
    history: GeminiChatTurn[];
    plantContext?: string;
  }): Promise<string> {
    const model = this.config.get<string>('GEMINI_MODEL');
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (!model || !apiKey) {
      throw new ServiceUnavailableException('Thiếu cấu hình Gemini AI');
    }

    const genAI = new GoogleGenAI({ apiKey });
    const contents = [
      {
        role: 'user' as const,
        parts: [
          {
            text: params.plantContext
              ? `${this.systemPrompt}\n\nBối cảnh cây của người dùng:\n${params.plantContext}`
              : this.systemPrompt,
          },
        ],
      },
      {
        role: 'model' as const,
        parts: [
          {
            text: 'Tôi sẵn sàng hỗ trợ bạn chăm sóc cây. Bạn cần tư vấn về điều gì?',
          },
        ],
      },
      ...params.history.map((turn) => ({
        role: turn.role,
        parts: [
          ...(turn.image_url
            ? [
                {
                  fileData: {
                    fileUri: turn.image_url,
                    mimeType: 'image/jpeg',
                  },
                },
              ]
            : []),
          { text: turn.content || '(ảnh đính kèm)' },
        ],
      })),
    ];

    const response = await genAI.models.generateContent({
      model,
      contents,
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      throw new ServiceUnavailableException('AI không trả lời được');
    }

    return text;
  }
}
