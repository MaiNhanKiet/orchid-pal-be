import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PrismaService } from '@app/prisma';
import {
  MICROSERVICES_CLIENTS,
  DeviceAssignedZoneEventDto,
  GetPlantsByZoneDto,
} from '@app/common';

interface SpeciesWiki {
  id: string;
  common_name: string;
  ideal_temp_min: number | null;
  ideal_temp_max: number | null;
  ideal_humid_min: number | null;
  ideal_humid_max: number | null;
}

@Injectable()
export class AutomationServiceService {
  private readonly logger = new Logger(AutomationServiceService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MICROSERVICES_CLIENTS.GARDEN_SERVICE)
    private readonly gardenClient: ClientProxy,
    @Inject('MQTT_CLIENT')
    private readonly mqttClient: ClientProxy,
  ) {}

  async handleDeviceAssignedZone(payload: DeviceAssignedZoneEventDto) {
    const { device_id, zone_id, user_id } = payload;

    if (!zone_id) {
      this.logger.warn(
        `Device ${device_id} has no zone_id — skipping rule generation.`,
      );
      return;
    }

    // 1. Tra cứu device để lấy serial_number
    const device = await this.prisma.devices.findUnique({
      where: { id: device_id },
      select: { serial_number: true },
    });

    if (!device) {
      this.logger.error(`Device ${device_id} not found.`);
      return;
    }

    // 2. Gọi Garden Service để lấy danh sách cây trong zone, từ đó lấy species_id
    const zoneQuery: GetPlantsByZoneDto = { zone_id };
    const plants: Array<{ id: string; species_id: string | null }> =
      await firstValueFrom(
        this.gardenClient.send({ cmd: 'get_plants_by_zone' }, zoneQuery),
      );

    if (!plants || plants.length === 0) {
      this.logger.warn(`No plants found in zone ${zone_id}.`);
      return;
    }

    const speciesId = plants[0].species_id;
    if (!speciesId) {
      this.logger.warn(`Plant in zone ${zone_id} has no species_id.`);
      return;
    }

    // 3. Gọi Garden Service để lấy thông tin loài cây (species) theo species_id
    const species: SpeciesWiki = await firstValueFrom(
      this.gardenClient.send({ cmd: 'get_species_by_id' }, { id: speciesId }),
    );

    if (!species) {
      this.logger.warn(`Species ${speciesId} not found.`);
      return;
    }

    // 4. Dịch chỉ số thành logic_config JSON
    const logicConfig = this.generateRules(species);

    // 5. Lưu automation rule vào DB
    const rule = await this.prisma.automation_rules.create({
      data: {
        zone_id,
        name: `Auto rule — ${species.common_name} (zone ${zone_id})`,
        is_active: true,
        logic_config: logicConfig as object,
      },
    });

    this.logger.log(
      `Created automation_rule ${rule.id} for zone ${zone_id} (${species.common_name}).`,
    );

    // 6. Đẩy config xuống MQTT topic để ESP32 có thể nhận và thực thi
    const topic = `device/${device.serial_number}/config`;
    this.mqttClient.emit(topic, logicConfig);

    this.logger.log(`Pushed config to MQTT topic: ${topic}`);
  }

  private generateRules(species: SpeciesWiki): object {
    const rules: object[] = [];

    const { ideal_humid_min, ideal_humid_max, ideal_temp_min, ideal_temp_max } =
      species;

    // Độ ẩm quá thấp → bơm nước
    if (ideal_humid_min != null) {
      rules.push({
        if: { metric: 'humidity', op: '<', value: ideal_humid_min },
        then: { action: 'pump', duration_ms: 10_000 },
      });
    }

    // Độ ẩm quá cao → thông gió
    if (ideal_humid_max != null) {
      rules.push({
        if: { metric: 'humidity', op: '>', value: ideal_humid_max },
        then: { action: 'vent', duration_ms: 15_000 },
      });
    }

    // Nhiệt độ quá cao → quạt làm mát
    if (ideal_temp_max != null) {
      rules.push({
        if: { metric: 'temperature', op: '>', value: ideal_temp_max },
        then: { action: 'fan', duration_ms: 20_000 },
      });
    }

    // Nhiệt độ quá thấp → sưởi
    if (ideal_temp_min != null) {
      rules.push({
        if: { metric: 'temperature', op: '<', value: ideal_temp_min },
        then: { action: 'heater', duration_ms: 30_000 },
      });
    }

    return {
      version: 1,
      species: species.common_name,
      generated_at: new Date().toISOString(),
      rules,
    };
  }
}
