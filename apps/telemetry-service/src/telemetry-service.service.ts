import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientProxy } from '@nestjs/microservices'; // Import thêm
import { Telemetry, TelemetryDocument } from './schemas/telemetry.schema';

@Injectable()
export class TelemetryServiceService {
  private readonly logger = new Logger(TelemetryServiceService.name);

  constructor(
    @InjectModel(Telemetry.name) private readonly telemetryModel: Model<TelemetryDocument>,
    @Inject('API_GATEWAY') private readonly rmqClient: ClientProxy,
  ) { }

  async saveTelemetryData(serialNumber: string, payload: any) {
    try {
      const temperature = payload.temp !== undefined ? Number(payload.temp) : null;
      const humidity = payload.humid !== undefined ? Number(payload.humid) : null;
      const soil_moisture = payload.soil !== undefined ? Number(payload.soil) : null;
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

      // 2. HOÀN THÀNH TODO: Bắn Event qua RabbitMQ cho API Gateway
      this.rmqClient.emit('telemetry_created_event', {
        serialNumber: serialNumber,
        timestamp: savedData.timestamp,
        sensors: {
          temp: temperature,
          humid: humidity,
          soil: soil_moisture,
          light: light,
        }
      });

      this.logger.debug(`[${serialNumber}] Emitted RMQ event 'telemetry_created_event'`);

    } catch (error) {
      this.logger.error(`Error saving telemetry: ${error.message}`);
    }
  }
}