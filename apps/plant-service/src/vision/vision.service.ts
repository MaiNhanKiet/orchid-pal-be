import { PlantsService } from '../plants/plants.service';

import { PrismaService } from '@app/prisma';

import { Injectable, ServiceUnavailableException } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { GoogleGenAI } from '@google/genai';



@Injectable()

export class VisionService {

  constructor(

    private readonly config: ConfigService,

    private readonly prisma: PrismaService,

    private readonly plantsService: PlantsService,

  ) {}



  private readonly systemPrompt = `

You are a GrowPal plant-care expert. Analyze the plant corner from the uploaded photo.

Return pure JSON only (no markdown) with this structure:

{

  "analysis": {

    "light_level": "LOW|MEDIUM|HIGH",

    "sun_exposure": "short English description of light conditions",

    "space_type": "balcony|indoor|rooftop",

    "observations": ["short English note about ventilation/airflow", "short English care note or risk"],

    "species_guess": "plant species name in English if identifiable"

  },

  "thresholds": {

    "relays": [

      {

        "relay_port": 1,

        "name": "PUMP",

        "rule_type": "SENSOR_THRESHOLD",

        "logic": {

          "moisture_min": 40,

          "water_duration_ms": 15000,

          "enabled": true

        }

      }

    ]

  }

}

All string values must be in English. Personalize moisture_min and water_duration_ms based on light, space, and plant species in the photo. The kit has only 1 relay controlling a water pump (ON/OFF).

`;



  private resolveMimeType(imageUrl: string): string {

    const lower = imageUrl.toLowerCase();

    if (lower.includes('.png')) return 'image/png';

    if (lower.includes('.webp')) return 'image/webp';

    return 'image/jpeg';

  }



  private async loadImageInlinePart(imageUrl: string) {

    const response = await fetch(imageUrl);

    if (!response.ok) {

      throw new ServiceUnavailableException('Không tải được ảnh để phân tích');

    }



    const mimeType =

      response.headers.get('content-type')?.split(';')[0]?.trim() ||

      this.resolveMimeType(imageUrl);

    const buffer = Buffer.from(await response.arrayBuffer());



    return {

      inlineData: {

        data: buffer.toString('base64'),

        mimeType,

      },

    };

  }



  async analyzePlantSetup(payload: {

    plant_id: string;

    user_id: string;

    image_url: string;

    location_city?: string;

    species_name?: string;

  }) {

    const model = this.config.get<string>('GEMINI_MODEL');

    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    if (!model || !apiKey) {

      throw new ServiceUnavailableException('Thiếu cấu hình Gemini AI');

    }



    const genAI = new GoogleGenAI({ apiKey });

    const userContext = [

      payload.location_city ? `City: ${payload.location_city}` : '',

      payload.species_name ? `Plant species: ${payload.species_name}` : '',

    ]

      .filter(Boolean)

      .join('. ');



    const imagePart = await this.loadImageInlinePart(payload.image_url);



    const response = await genAI.models.generateContent({

      model,

      contents: [

        {

          role: 'user',

          parts: [

            { text: `${this.systemPrompt}\n\n${userContext}` },

            imagePart,

          ],

        },

      ],

    });



    const raw = (response.text ?? '').replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed: { analysis?: object; thresholds?: object };

    try {

      parsed = JSON.parse(raw);

    } catch {

      throw new ServiceUnavailableException('AI trả về định dạng không hợp lệ');

    }



    return this.plantsService.applyAiAnalysis(

      payload.plant_id,

      payload.user_id,

      parsed.analysis ?? {},

      parsed.thresholds ?? {},

    );

  }

}


