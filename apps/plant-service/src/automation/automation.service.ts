import { UpdateAutomationRulesDto } from '@app/common';
import {
  MQTT_BROKER_PASSWORD,
  MQTT_BROKER_URL,
  MQTT_BROKER_USERNAME,
} from '@app/common/constants/env-key.constant';
import { MQTT_DEVICE_TOPIC } from '@app/common/constants/mqtt-topics.constant';
import { buildFirmwareDeviceConfig } from '@app/common/mappers/firmware-config.mapper';
import { PrismaService } from '@app/prisma';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import mqtt, { MqttClient } from 'mqtt';
import { Model } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import {
  AutomationLog,
  AutomationLogDocument,
} from './schema/automation-log.schema';
import { DeviceAssignedPlantEvent, ManualControlEvent } from '../devices/devices.service';

type RelayThreshold = {
  relay_port: number;
  name: string;
  rule_type?: string;
  logic: Record<string, unknown>;
};

@Injectable()
export class AutomationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AutomationService.name);
  private configPublisher: MqttClient | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Inject('MQTT_CLIENT') private readonly mqttClient: ClientProxy,
    @InjectModel(AutomationLog.name)
    private readonly automationLogModel: Model<AutomationLogDocument>,
  ) {}

  async onModuleInit() {
    try {
      await this.mqttClient.connect();
    } catch (error) {
      this.logger.warn(`MQTT control client connect deferred: ${String(error)}`);
    }

    if (!MQTT_BROKER_URL) {
      this.logger.error('MQTT_BROKER_URL is missing — device config will not be published');
      return;
    }

    this.configPublisher = mqtt.connect(MQTT_BROKER_URL, {
      username: MQTT_BROKER_USERNAME,
      password: MQTT_BROKER_PASSWORD,
      reconnectPeriod: 5_000,
    });

    this.configPublisher.on('connect', () => {
      this.logger.log('MQTT config publisher connected');
    });

    this.configPublisher.on('error', (error) => {
      this.logger.error(`MQTT config publisher error: ${error.message}`);
    });
  }

  onModuleDestroy() {
    this.configPublisher?.end(true);
  }

  async handleDeviceAssignedPlant(payload: DeviceAssignedPlantEvent) {
    const { device_id, plant_id } = payload;

    const [device, plant] = await Promise.all([
      this.prisma.devices.findUnique({
        where: { id: device_id },
        include: { device_relays: true },
      }),
      this.prisma.my_plants.findUnique({ where: { id: plant_id } }),
    ]);

    if (!device || !plant) {
      this.logger.error('Device or plant not found for automation setup');
      return;
    }

    const thresholds = (plant.ai_suggested_thresholds ?? {}) as {
      relays?: RelayThreshold[];
      default?: Record<string, unknown>;
    };

    const relayRules = (
      thresholds.relays ?? this.buildDefaultRelayRules(device.device_relays)
    )
      .filter((rule) => rule.name === 'PUMP')
      .map((rule) => ({
        ...rule,
        rule_type: this.normalizeRuleType(rule.rule_type),
      }));

    const activeRules = await this.prisma.automation_rules.findMany({
      where: { device_id, is_active: true },
    });

    const rulesAlreadyMatch =
      relayRules.length > 0 &&
      relayRules.every((rule) =>
        activeRules.some(
          (existing) =>
            existing.relay_port === rule.relay_port &&
            existing.name === rule.name &&
            this.normalizeRuleType(existing.rule_type ?? undefined) === rule.rule_type &&
            JSON.stringify(existing.logic_config) === JSON.stringify(rule.logic),
        ),
      );

    if (rulesAlreadyMatch) {
      await this.publishFullDeviceConfig(device_id);
      this.logger.log(`Automation rules unchanged for ${device_id}; config republished`);
      return;
    }

    await this.prisma.automation_rules.updateMany({
      where: { device_id, is_active: true },
      data: { is_active: false },
    });

    for (const relayRule of relayRules) {
      await this.prisma.automation_rules.create({
        data: {
          device_id,
          relay_port: relayRule.relay_port,
          name: relayRule.name,
          rule_type: this.normalizeRuleType(relayRule.rule_type),
          is_active: true,
          logic_config: relayRule.logic as object,
        },
      });
    }

    await this.publishFullDeviceConfig(device_id);
    this.logger.log(`Automation config sent to ${MQTT_DEVICE_TOPIC.config(device.serial_number)}`);
  }

  private async publishMqttMessage(
    topic: string,
    payload: string,
    retain: boolean,
  ) {
    if (this.configPublisher) {
      if (!this.configPublisher.connected) {
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('MQTT connect timeout')), 10_000);
          const onConnect = () => {
            clearTimeout(timeout);
            resolve();
          };
          const onError = (error: Error) => {
            clearTimeout(timeout);
            reject(error);
          };
          this.configPublisher!.once('connect', onConnect);
          this.configPublisher!.once('error', onError);
        });
      }

      await new Promise<void>((resolve, reject) => {
        this.configPublisher!.publish(
          topic,
          payload,
          { qos: 1, retain },
          (error) => {
            if (error) reject(error);
            else resolve();
          },
        );
      });
      return;
    }

    await firstValueFrom(this.mqttClient.emit(topic, payload));
  }

  private async publishFullDeviceConfig(deviceId: string) {
    const device = await this.prisma.devices.findUnique({
      where: { id: deviceId },
      include: { device_relays: true },
    });

    if (!device) {
      throw new NotFoundException('Device not found for config publish');
    }

    const activeRules = await this.prisma.automation_rules.findMany({
      where: { device_id: deviceId, is_active: true },
    });

    const mqttPayload = buildFirmwareDeviceConfig({
      relays: device.device_relays,
      activeRules: activeRules.map((rule) => ({
        relay_port: rule.relay_port,
        name: rule.name,
        logic_config: rule.logic_config as Record<string, unknown>,
      })),
    });

    const topic = MQTT_DEVICE_TOPIC.config(device.serial_number);
    await this.publishDeviceConfig(topic, mqttPayload);
    this.logger.log(`Firmware config sent to ${topic}`);
  }

  private async publishDeviceConfig(
    topic: string,
    payload: Record<string, unknown> | ReturnType<typeof buildFirmwareDeviceConfig>,
  ) {
    const body = JSON.stringify(payload);
    await this.publishMqttMessage(topic, body, true);
  }

  async handleManualControl(payload: ManualControlEvent) {
    const relayPort = Number(payload.relay_port);
    if (!Number.isFinite(relayPort) || relayPort < 1) {
      this.logger.error(
        `Invalid relay_port for manual control on ${payload.serial_number}`,
      );
      throw new BadRequestException('Relay port is required for manual control');
    }

    const topic = MQTT_DEVICE_TOPIC.control(payload.serial_number, relayPort);
    await this.publishMqttMessage(topic, payload.action, false);
    this.logger.log(`Manual control sent to ${topic}: ${payload.action}`);

    const device = await this.prisma.devices.findUnique({
      where: { id: payload.device_id },
      select: { plant_id: true },
    });

    await this.logAction({
      plant_id: device?.plant_id ?? 'unknown',
      device_id: payload.serial_number,
      action: `Manual ${payload.action} relay ${payload.relay_port}`,
      trigger_reason: payload.trigger_reason ?? 'MANUAL_USER_APP',
    });
  }

  async updateAutomationRules(payload: UpdateAutomationRulesDto) {
    const { device_id, relay_port, logic, user_id } = payload as UpdateAutomationRulesDto & {
      device_id: string;
      relay_port: number;
      user_id: string;
    };

    const device = await this.prisma.devices.findFirst({
      where: { id: device_id, owner_id: user_id },
      include: { my_plants: true, device_relays: true },
    });
    if (!device) throw new BadRequestException('Thiết bị không tồn tại');

    await this.prisma.automation_rules.updateMany({
      where: { device_id, relay_port, is_active: true },
      data: { is_active: false },
    });

    const rule = await this.prisma.automation_rules.create({
      data: {
        device_id,
        relay_port,
        name: `Manual — relay ${relay_port}`,
        rule_type: 'SENSOR_THRESHOLD',
        is_active: true,
        logic_config: logic as object,
      },
    });

    await this.publishFullDeviceConfig(device.id);

    return { message: 'Đã cập nhật automation rule', rule_id: rule.id };
  }

  async deleteAutomationRule(payload: { rule_id: string; user_id: string }) {
    const rule = await this.findOwnedRule(payload.rule_id, payload.user_id);

    if (rule.is_active) {
      throw new BadRequestException(
        'Cannot delete the active rule. Activate another rule first.',
      );
    }

    await this.prisma.automation_rules.delete({ where: { id: rule.id } });

    return { message: 'Automation rule deleted', rule_id: rule.id };
  }

  async activateAutomationRule(payload: { rule_id: string; user_id: string }) {
    const rule = await this.findOwnedRule(payload.rule_id, payload.user_id);

    if (!rule.devices) {
      throw new NotFoundException('Device not found for this rule');
    }

    if (rule.is_active) {
      return { message: 'Rule already active', rule_id: rule.id };
    }

    await this.prisma.automation_rules.updateMany({
      where: {
        device_id: rule.device_id!,
        relay_port: rule.relay_port,
        is_active: true,
      },
      data: { is_active: false },
    });

    await this.prisma.automation_rules.update({
      where: { id: rule.id },
      data: { is_active: true },
    });

    await this.publishFullDeviceConfig(rule.device_id!);

    return { message: 'Automation rule activated', rule_id: rule.id };
  }

  async refreshAutomationByPlant(payload: { plant_id: string; user_id: string }) {
    const device = await this.prisma.devices.findFirst({
      where: { plant_id: payload.plant_id, owner_id: payload.user_id },
    });
    if (!device) throw new BadRequestException('Cây chưa có Kit');

    return this.handleDeviceAssignedPlant({
      device_id: device.id,
      plant_id: payload.plant_id,
      user_id: payload.user_id,
    });
  }

  async logAction(data: {
    plant_id: string;
    device_id: string;
    action: string;
    trigger_reason: string;
    value?: number;
  }) {
    await this.automationLogModel.create(data);
  }

  async getDeviceLogs(device_id: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      this.automationLogModel
        .find({ device_id })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.automationLogModel.countDocuments({ device_id }),
    ]);
    return { logs, page, limit, total, totalPages: Math.ceil(total / limit) };
  }

  async getMyDeviceLogs(
    serial_number: string,
    user_id: string,
    page = 1,
    limit = 20,
  ) {
    const device = await this.prisma.devices.findFirst({
      where: { serial_number, owner_id: user_id },
      select: { serial_number: true },
    });

    if (!device?.serial_number) {
      throw new ForbiddenException('You do not own this device');
    }

    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));

    return this.getDeviceLogs(device.serial_number, safePage, safeLimit);
  }

  private async findOwnedRule(rule_id: string, user_id: string) {
    const rule = await this.prisma.automation_rules.findUnique({
      where: { id: rule_id },
      include: { devices: true },
    });

    if (!rule?.device_id) {
      throw new NotFoundException('Automation rule not found');
    }

    if (rule.devices?.owner_id !== user_id) {
      throw new ForbiddenException('You do not own this automation rule');
    }

    return rule;
  }

  private normalizeRuleType(ruleType?: string): 'SENSOR_THRESHOLD' | 'TIME_SCHEDULE' {
    if (ruleType === 'TIME_SCHEDULE') return 'TIME_SCHEDULE';
    return 'SENSOR_THRESHOLD';
  }

  private buildDefaultRelayRules(
    relays: Array<{ relay_port: number; name: string | null }>,
  ): RelayThreshold[] {
    const pump =
      relays.find((r) => r.name === 'PUMP') ??
      relays.find((r) => r.relay_port === 1) ??
      relays[0];

    if (!pump) {
      return [
        {
          relay_port: 1,
          name: 'PUMP',
          rule_type: 'SENSOR_THRESHOLD',
          logic: {
            moisture_min: 40,
            water_duration_ms: 15000,
            enabled: true,
          },
        },
      ];
    }

    return [
      {
        relay_port: pump.relay_port,
        name: 'PUMP',
        rule_type: 'SENSOR_THRESHOLD',
        logic: {
          moisture_min: 40,
          water_duration_ms: 15000,
          enabled: true,
        },
      },
    ];
  }
}
