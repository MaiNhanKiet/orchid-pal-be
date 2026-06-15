import {
  DeviceAssignedZoneEventDto,
  HardwareConfig,
  ManualControlEventDto,
  MICROSERVICES_CLIENTS,
  SpeciesWiki,
  UpdateAutomationRulesDto,
} from '@app/common'; // Đảm bảo đường dẫn đúng với project của bạn
import { PrismaService } from '@app/prisma'; // Đảm bảo đường dẫn đúng với project của bạn
import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { GrpcRpcService } from '@app/grpc';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import {
  AutomationLog,
  AutomationLogDocument,
} from './schema/automation-log.schema';

type ZonePlantRuleInfo = {
  zone_id: string;
  plant_id: string;
  species_id: string | null;
  species_common_name: string;
};

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly grpcRpc: GrpcRpcService,
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
      await this.grpcRpc.send(
        MICROSERVICES_CLIENTS.BALCONY_SERVICE,
        'get_plants_by_zone',
        zone_id,
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
    const species: SpeciesWiki = await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_species_by_id',
      { id: speciesId },
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

    await firstValueFrom(this.mqttClient.emit(topic, message));

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

  async updateAutomationRules(payload: UpdateAutomationRulesDto) {
    const { zone_id, user_id, logic } = payload;

    const zonePlantInfo = await this.grpcRpc.send<ZonePlantRuleInfo>(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_zone_current_plant_for_rule',
      { zone_id, user_id },
    );

    // 1. Tắt tất cả các rule cũ trong zone
    await this.prisma.automation_rules.updateMany({
      where: { zone_id, is_active: true },
      data: { is_active: false },
    });

    // 2. Tạo rule mới
    const rule = await this.prisma.automation_rules.create({
      data: {
        zone_id,
        name: `Manual Update — ${zonePlantInfo.species_common_name}`,
        is_active: true,
        logic_config: logic,
      },
    });

    this.logger.log(
      `Created manual automation_rule ${rule.id} for zone ${zone_id}`,
    );

    // 3. Lấy thiết bị trong zone để cập nhật config.
    const device = await this.prisma.devices.findFirst({
      where: { zone_id, status: { not: 'INACTIVE' } },
      select: { serial_number: true, hardware_config: true },
    });

    if (!device) {
      throw new BadRequestException(
        'Zone chưa có device hoạt động để nhận automation config.',
      );
    }

    // 4. Gửi config xuống thiết bị
    const hardwareConfig = (device.hardware_config || {}) as HardwareConfig;
    const mqttPayload = {
      version: 1,
      species: zonePlantInfo.species_common_name,
      generated_at: new Date().toISOString(),
      hardware: hardwareConfig,
      logic,
    };

    const topic = `device/${device.serial_number}/config`;
    this.mqttClient.emit(topic, mqttPayload);
    this.logger.log(`Sent updated config to device ${device.serial_number}`);

    return {
      message: 'Automation rules updated and sent to device.',
      rule_id: rule.id,
    };
  }

  async refreshAutomationRulesByZone(payload: {
    zone_id: string;
    user_id: string;
  }) {
    const { zone_id, user_id } = payload;

    const zonePlantInfo = await this.grpcRpc.send<ZonePlantRuleInfo>(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_zone_current_plant_for_rule',
      { zone_id, user_id },
    );

    const device = await this.prisma.devices.findFirst({
      where: { zone_id, status: { not: 'INACTIVE' } },
      select: {
        id: true,
        serial_number: true,
        hardware_config: true,
      },
    });

    if (!device) {
      throw new BadRequestException(
        'Zone chưa có device hoạt động. Không thể refresh automation rule.',
      );
    }

    if (!zonePlantInfo.species_id) {
      throw new BadRequestException(
        'Plant trong zone chưa có species hợp lệ. Không thể refresh automation rule.',
      );
    }

    const species: SpeciesWiki = await this.grpcRpc.send(
      MICROSERVICES_CLIENTS.BALCONY_SERVICE,
      'get_species_by_id',
      { id: zonePlantInfo.species_id },
    );

    if (!species) {
      throw new BadRequestException('Không tìm thấy species của plant trong zone.');
    }

    const hardwareConfig = (device.hardware_config || {}) as HardwareConfig;
    const logicConfigRules = this.generateRules(species, hardwareConfig);

    await this.prisma.automation_rules.updateMany({
      where: { zone_id, is_active: true },
      data: { is_active: false },
    });

    const rule = await this.prisma.automation_rules.create({
      data: {
        zone_id,
        name: `Auto refresh — ${species.common_name} (zone ${zone_id})`,
        is_active: true,
        logic_config: logicConfigRules as object,
      },
    });

    const mqttPayload = {
      version: 1,
      species: species.common_name,
      generated_at: new Date().toISOString(),
      hardware: hardwareConfig,
      logic: logicConfigRules,
    };

    const topic = `device/${device.serial_number}/config`;
    this.mqttClient.emit(topic, mqttPayload);

    this.logger.log(
      `Refreshed automation_rule ${rule.id} for zone ${zone_id} using plant ${zonePlantInfo.plant_id} and device ${device.id}.`,
    );

    return {
      message: 'Đã refresh automation rule theo plant + device hiện tại của zone.',
      rule_id: rule.id,
      zone_id,
      plant_id: zonePlantInfo.plant_id,
      device_id: device.id,
    };
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
      this.logger.log(
        `[Activity Log] Đã lưu log: ${data.action} (Lý do: ${data.trigger_reason})`,
      );
    } catch (error) {
      this.logger.error(`[Activity Log] Lỗi khi lưu log: ${error.message}`);
    }
  }

  async getDeviceLogs(deviceId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.automationLogModel
        .find({ device_id: deviceId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.automationLogModel.countDocuments({ device_id: deviceId }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      last_page: Math.ceil(total / limit),
    };
  }
}
