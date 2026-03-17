import { PrismaService } from '@app/prisma';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Telemetry, TelemetryDocument } from './schemas/telemetry.schema';

@Injectable()
export class TelemetryServiceService {
  private readonly logger = new Logger(TelemetryServiceService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: any;

  constructor(
    @InjectModel(Telemetry.name)
    private readonly telemetryModel: Model<TelemetryDocument>,
    @Inject('API_GATEWAY') private readonly rmqClient: ClientProxy,
    private readonly prismaService: PrismaService,
  ) {
    // In a production environment, use ConfigService to get the key from process.env
    this.genAI = new GoogleGenerativeAI(
      'AIzaSyCiygy4dmp1Vvvixlg6vKsAoPk3JdBaSa4',
    );
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async saveTelemetryData(serialNumber: string, payload: any) {
    try {
      const temperature =
        payload.temp !== undefined ? Number(payload.temp) : null;
      const humidity =
        payload.humid !== undefined ? Number(payload.humid) : null;
      const soil_moisture =
        payload.soil !== undefined ? Number(payload.soil) : null;
      const light = payload.light !== undefined ? Number(payload.light) : null;

      const newData = new this.telemetryModel({
        timestamp: new Date(),
        metadata: { serial_number: serialNumber },
        temperature,
        humidity,
        soil_moisture,
        light,
      });

      // 1. Lưu vào MongoDB
      const savedData = await newData.save();
      this.logger.log(`[${serialNumber}] Saved telemetry to DB`);

      // 2. Bắn Event qua RabbitMQ cho API Gateway
      this.rmqClient.emit('telemetry_created_event', {
        serialNumber: serialNumber,
        timestamp: savedData.timestamp,
        sensors: {
          temp: temperature,
          humid: humidity,
          soil: soil_moisture,
          light: light,
        },
      });

      this.logger.debug(
        `[${serialNumber}] Emitted RMQ event 'telemetry_created_event'`,
      );
    } catch (error) {
      this.logger.error(`Error saving telemetry: ${error.message}`);
    }
  }

  async getLatestTelemetry(serialNumber: string) {
    try {
      const latestData = await this.telemetryModel
        .findOne({ 'metadata.serial_number': serialNumber })
        .sort({ timestamp: -1 })
        .exec();

      return latestData;
    } catch (error) {
      this.logger.error(
        `Error getting latest telemetry for ${serialNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  async getHistoryTelemetry(serialNumber: string, hours: number = 24) {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      const historyData = await this.telemetryModel
        .find({
          'metadata.serial_number': serialNumber,
          timestamp: { $gte: startTime },
        })
        .sort({ timestamp: 1 })
        .select('timestamp temperature humidity soil_moisture light -_id')
        .exec();

      return historyData;
    } catch (error) {
      this.logger.error(
        `Error getting history telemetry for ${serialNumber}: ${error.message}`,
      );
      throw error;
    }
  }

  async analyzeSeasonalConfig(
    zoneId: string,
    currentConfig: any,
    days: number = 3,
  ) {
    try {
      // 1. Get Zone Info and Devices
      const zone = await this.prismaService.planting_zones.findUnique({
        where: { id: zoneId },
        include: { devices: { select: { serial_number: true } } },
      });

      if (!zone) {
        throw new Error('Zone not found');
      }

      if (!zone.devices || zone.devices.length === 0) {
        this.logger.warn(`No devices found in zone ${zoneId}`);
        return currentConfig; // No data to analyze
      }

      // 2. Fetch Telemetry Data
      const hours = days * 24;
      let totalTemp = 0;
      let totalHumid = 0;
      let count = 0;

      for (const device of zone.devices) {
        const history = await this.getHistoryTelemetry(
          device.serial_number,
          hours,
        );
        if (history && history.length > 0) {
          for (const record of history) {
            if (record.temperature && record.humidity) {
              totalTemp += record.temperature;
              totalHumid += record.humidity;
              count++;
            }
          }
        }
      }

      if (count === 0) {
        return currentConfig; // No telemetry data
      }

      const avgTemp = totalTemp / count;
      const avgHumid = totalHumid / count;

      // 3. AI Analysis with Gemini
      this.logger.log(
        `AI Analysis for Zone ${zone.name}: AvgTemp=${avgTemp.toFixed(1)}, AvgHumid=${avgHumid.toFixed(1)}`,
      );

      const prompt = `
        You are an expert orchid care assistant for a smart garden system.
        I will provide you with the average environmental conditions of a zone for the last ${days} days and the current hardware configuration.
        
        Your task is to analyze if the current configuration is suitable for these conditions, or if a TEMPORARY SEASONAL ADJUSTMENT is needed.
        
        Context:
        - Zone Name: ${zone.name} (Location: ${zone.location_city || 'Unknown'})
        - Exposure: ${zone.exposure || 'Unknown'}
        - Average Temperature: ${avgTemp.toFixed(1)}°C
        - Average Humidity: ${avgHumid.toFixed(1)}%
        - Current Hardware Config: ${JSON.stringify(currentConfig)}
        
        Instructions:
        1. Access the environmental impact on orchids (assume generic orchid needs if species not specified, e.g. 20-30°C, 50-70% humidity).
        2. If the conditions are significantly different from ideal (e.g., heatwave, cold snap, dry spell), modify the config to compensate (e.g., increase watering frequency/duration).
        3. Only modify the values if necessary. If everything is fine, keep it similar to the original.
        4. Add a "reason" field in the config or nested objects explaining why you changed it, prefixed with "AI adjusted: ".
        
        Output Format:
        Return ONLY valid JSON. The JSON should be the new configuration object. Do not include markdown formatting like \`\`\`json.
      `;

      try {
        const result = await this.model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean up markdown if Gemini includes it
        const cleanedJson = responseText
          .replace(/^```json/, '')
          .replace(/```$/, '')
          .trim();

        const newConfig = JSON.parse(cleanedJson);

        return {
          original: currentConfig,
          suggestion: newConfig,
          analysis: {
            period: `${days} days`,
            average_temperature: avgTemp,
            average_humidity: avgHumid,
            zone_name: zone.name,
            ai_note: 'Seasonal adjustment generated by Gemini AI.',
          },
        };
      } catch (aiError) {
        this.logger.error(`Gemini AI analysis failed: ${aiError.message}`);
        // Fallback to original config if AI fails
        return {
          original: currentConfig,
          suggestion: currentConfig,
          analysis: {
            period: `${days} days`,
            error: 'AI service unavailable, returned original config.',
          },
        };
      }
    } catch (error) {
      this.logger.error(`Error analyzing seasonal config: ${error.message}`);
      throw error;
    }
  }
}
