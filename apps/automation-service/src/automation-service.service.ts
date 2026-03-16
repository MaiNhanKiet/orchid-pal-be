import {
  DeviceAssignedZoneEventDto,
  HardwareConfig,
  ManualControlEventDto,
  MICROSERVICES_CLIENTS,
  SpeciesWiki,
} from '@app/common'; // Đảm bảo đường dẫn đúng với project của bạn
import { PrismaService } from '@app/prisma'; // Đảm bảo đường dẫn đúng với project của bạn
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AutomationLog, AutomationLogDocument } from './schema/automation-log.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class AutomationServiceService {
  private readonly logger = new Logger(AutomationServiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MICROSERVICES_CLIENTS.GARDEN_SERVICE)
    private readonly gardenClient: ClientProxy,
    @Inject('MQTT_CLIENT')
    private readonly mqttClient: ClientProxy,
    @InjectModel(AutomationLog.name)
    private readonly automationLogModel: Model<AutomationLogDocument>,
  ) { }

  async handleDeviceAssignedZone(payload: DeviceAssignedZoneEventDto) {
    const { device_id, zone_id } = payload;

    if (!zone_id) {
      this.logger.warn(
        `Device ${device_id} has no zone_id — skipping rule generation.`,
      );
      return;
    }

    // 1. Lấy serial_number và hardware_config
    const device = await this.prisma.devices.findUnique({
      where: { id: device_id },
      select: {
        serial_number: true,
        hardware_config: true,
      },
    });

    if (!device) {
      this.logger.error(`Device ${device_id} not found.`);
      return;
    }

    const hardwareConfig = (device.hardware_config || {}) as HardwareConfig;

    // 2. Gọi Garden Service để lấy cây trong zone
    const plants: Array<{ id: string; species_id: string | null }> =
      await firstValueFrom(
        this.gardenClient.send({ cmd: 'get_plants_by_zone' }, zone_id),
      );

    this.logger.log(`Plants found in zone ${zone_id}: ${plants.length}`);

    if (!plants || plants.length === 0) {
      this.logger.warn(`No plants found in zone ${zone_id}.`);
      return;
    }

    const speciesId = plants[0].species_id;
    if (!speciesId) {
      this.logger.warn(`Plant in zone ${zone_id} has no species_id.`);
      return;
    }

    // 3. Gọi Garden Service để lấy spec wiki
    const species: SpeciesWiki = await firstValueFrom(
      this.gardenClient.send({ cmd: 'get_species_by_id' }, { id: speciesId }),
    );

    if (!species) {
      this.logger.warn(`Species ${speciesId} not found.`);
      return;
    }

    // 4. Dịch chỉ số thành logic_config JSON
    const logicConfigRules = this.generateRules(species, hardwareConfig);

    // 5. Tắt tất cả các rule cũ trong zone (nếu có) trước khi tạo mới
    await this.prisma.automation_rules.updateMany({
      where: { zone_id, is_active: true },
      data: { is_active: false },
    });

    // 6. Lưu automation rule mới vào Database
    const rule = await this.prisma.automation_rules.create({
      data: {
        zone_id,
        name: `Auto rule — ${species.common_name} (zone ${zone_id})`,
        is_active: true,
        logic_config: logicConfigRules as object,
      },
    });

    this.logger.log(
      `Created automation_rule ${rule.id} for zone ${zone_id} (${species.common_name}).`,
    );

    // 7. Gói data cần thiết để gửi xuống MQTT cho ESP32
    const mqttPayload = {
      version: 1,
      species: species.common_name,
      generated_at: new Date().toISOString(),
      hardware: hardwareConfig, // Gửi cấu hình phần cứng
      logic: logicConfigRules, // Gửi xuống để ESP32 biết ngưỡng cảm biến
    };

    // 8. Đẩy config xuống MQTT topic cho ESP32
    const topic = `device/${device.serial_number}/config`;
    this.mqttClient.emit(topic, mqttPayload);
  }

  async handleManualControl(payload: ManualControlEventDto) {
    const topic = `device/${payload.serial_number}/control/${payload.relay_number}`;
    const message = payload.action;

    await firstValueFrom(
      this.mqttClient.emit(topic, message)
    );

    this.logger.log(
      `[Manual Control] Đã bắn lệnh xuống MQTT topic: ${topic} (payload: ${message})`,
    );

    await this.logAction({
      zone_id: payload.zone_id,
      device_id: payload.serial_number,
      action: `Lệnh ${payload.action} rơ-le số ${payload.relay_number} (${payload.role})`,
      trigger_reason: 'MANUAL_USER_APP',
    });
  }

  private generateRules(
    species: SpeciesWiki,
    hardware: HardwareConfig,
  ): object[] {
    const rules: object[] = [];
    const { ideal_humid_min, ideal_humid_max, ideal_temp_min, ideal_temp_max } =
      species;

    const sensors = hardware.sensors || {};
    const relays = hardware.relays || {};
    const relayValues = Object.values(relays);

    /* 
      Rule 1: Độ ẩm quá thấp > Bơm nước
      Điều kiện: 
        + Có cảm biến độ ẩm (hoặc độ ẩm đất)
        + Có Relay nối với 'pump'
    */
    const hasPump = relayValues.includes('pump');
    if (ideal_humid_min != null && sensors.humidity && hasPump) {
      rules.push({
        if: { metric: 'humidity', op: '<', value: ideal_humid_min },
        then: { action: 'pump', duration_ms: 10_000 },
      });
    }

    /*
      Rule 2: Độ ẩm quá cao > Thông gió / Phun sương
    */
    const hasVent = relayValues.includes('vent');
    if (ideal_humid_max != null && sensors.humidity && hasVent) {
      rules.push({
        if: { metric: 'humidity', op: '>', value: ideal_humid_max },
        then: { action: 'vent', duration_ms: 15_000 },
      });
    }

    /*
      Rule 3: Nhiệt độ quá cao > Quạt làm mát
      Điều kiện: Có cảm biến nhiệt độ và có Relay nối với 'fan'
    */
    const hasFan = relayValues.includes('fan');
    if (ideal_temp_max != null && sensors.temperature && hasFan) {
      rules.push({
        if: { metric: 'temperature', op: '>', value: ideal_temp_max },
        then: { action: 'fan', duration_ms: 20_000 },
      });
    }

    /*
      Rule 4: Nhiệt độ quá thấp > Sưởi
      Điều kiện: Có cảm biến nhiệt độ và có Relay nối với 'heater'
    */
    const hasHeater = relayValues.includes('heater');
    if (ideal_temp_min != null && sensors.temperature && hasHeater) {
      rules.push({
        if: { metric: 'temperature', op: '<', value: ideal_temp_min },
        then: { action: 'heater', duration_ms: 30_000 },
      });
    }

    return rules;
  }

  async logAction(data: {
    zone_id: string;
    device_id: string;
    action: string;
    trigger_reason: string;
    value?: number;
  }) {
    try {
      const newLog = new this.automationLogModel(data);
      await newLog.save();
      this.logger.log(`[Activity Log] Đã lưu log: ${data.action} (Lý do: ${data.trigger_reason})`);
    } catch (error) {
      this.logger.error(`[Activity Log] Lỗi khi lưu log: ${error.message}`);
    }
  }
}
