import { PrismaService } from '@app/prisma';
import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientProxy } from '@nestjs/microservices';
import { Model } from 'mongoose';
import { Telemetry, TelemetryDocument } from '../schemas/telemetry.schema';

@Injectable()
export class TelemetryService {
  constructor(
    @InjectModel(Telemetry.name)
    private readonly telemetryModel: Model<TelemetryDocument>,
    @Inject('API_GATEWAY') private readonly apiGatewayClient: ClientProxy,
    private readonly prisma: PrismaService,
  ) {}

  async saveTelemetryData(serialNumber: string, payload: Record<string, unknown>) {
    const temperature = payload.temp !== undefined ? Number(payload.temp) : null;
    const humidity = payload.humid !== undefined ? Number(payload.humid) : null;
    const soil_moisture = payload.soil !== undefined ? Number(payload.soil) : null;
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
      sensors: { temp: temperature, humid: humidity, soil: soil_moisture, light },
    });

    return savedData;
  }

  async getLatestTelemetry(serialNumber: string) {
    return this.telemetryModel
      .findOne({ 'metadata.serial_number': serialNumber })
      .sort({ timestamp: -1 })
      .exec();
  }

  async getHistoryTelemetry(serialNumber: string, hours = 24) {
    const startTime = new Date();
    startTime.setHours(startTime.getHours() - hours);

    return this.telemetryModel
      .find({
        'metadata.serial_number': serialNumber,
        timestamp: { $gte: startTime },
      })
      .sort({ timestamp: 1 })
      .lean()
      .exec();
  }

  async getTelemetryByPlant(plant_id: string, user_id: string, hours = 24) {
    const device = await this.prisma.devices.findFirst({
      where: { plant_id, owner_id: user_id },
    });
    if (!device) return { data: [], message: 'Cây chưa có Kit' };
    const data = await this.getHistoryTelemetry(device.serial_number, hours);
    return { serial_number: device.serial_number, data };
  }
}
