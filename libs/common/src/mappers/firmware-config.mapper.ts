import { HardwareConfig } from '../interfaces/automation-service.interface';

export interface FirmwareLogicRule {
  if: {
    metric: 'temperature' | 'humidity' | 'soil_moisture' | 'light' | string;
    op: '>' | '<' | '==' | string;
    value: number;
  };
  then: {
    action: string;
    duration_ms: number;
    cooldown_ms: number;
  };
}

export interface FirmwareDeviceConfigPayload {
  data: {
    hardware: {
      sensors: {
        temperature: boolean;
        humidity: boolean;
        soil_moisture: boolean;
        light: boolean;
      };
      relays: {
        relay_1: string;
        relay_2: string;
        relay_3: string;
        relay_4: string;
      };
    };
    logic: FirmwareLogicRule[];
  };
}

const DEFAULT_SENSORS: FirmwareDeviceConfigPayload['data']['hardware']['sensors'] = {
  temperature: true,
  humidity: true,
  soil_moisture: true,
  light: true,
};

type DeviceRelayInput = {
  relay_port: number;
  name: string | null;
};

type AutomationRuleInput = {
  relay_port: number;
  name: string | null;
  logic_config: Record<string, unknown>;
};

/** Map backend relay name to firmware role string (matches ESP32 rule engine). */
export function relayNameToFirmwareRole(name: string | null | undefined): string {
  if (!name) return 'null';

  const normalized = name.trim();
  if (!normalized || normalized.toLowerCase() === 'null' || normalized.toLowerCase() === 'unused') {
    return 'null';
  }

  const upper = normalized.toUpperCase();
  if (upper === 'PUMP') return 'water_pump';

  return normalized.toLowerCase().replace(/\s+/g, '_');
}

export function buildRelayHardwareMap(
  relays: DeviceRelayInput[],
): FirmwareDeviceConfigPayload['data']['hardware']['relays'] {
  const map: FirmwareDeviceConfigPayload['data']['hardware']['relays'] = {
    relay_1: 'null',
    relay_2: 'null',
    relay_3: 'null',
    relay_4: 'null',
  };

  for (const relay of relays) {
    if (relay.relay_port >= 1 && relay.relay_port <= 4) {
      const key = `relay_${relay.relay_port}` as keyof typeof map;
      map[key] = relayNameToFirmwareRole(relay.name);
    }
  }

  return map;
}

export function logicConfigToFirmwareRule(
  relayRole: string,
  logic: Record<string, unknown>,
): FirmwareLogicRule | null {
  if (logic.enabled === false) return null;
  if (relayRole === 'null') return null;

  const ifBlock = logic.if;
  const thenBlock = logic.then;
  if (
    typeof ifBlock === 'object' &&
    ifBlock !== null &&
    typeof thenBlock === 'object' &&
    thenBlock !== null
  ) {
    return logic as unknown as FirmwareLogicRule;
  }

  const moistureMin = Number(logic.moisture_min ?? 40);
  const durationMs = Number(logic.water_duration_ms ?? logic.duration_ms ?? 15_000);
  const cooldownMs = Number(logic.cooldown_ms ?? 15_000);

  return {
    if: {
      metric: 'soil_moisture',
      op: '<',
      value: moistureMin,
    },
    then: {
      action: relayRole,
      duration_ms: durationMs,
      cooldown_ms: cooldownMs,
    },
  };
}

export function buildFirmwareDeviceConfig(params: {
  relays: DeviceRelayInput[];
  activeRules: AutomationRuleInput[];
  sensors?: HardwareConfig['sensors'];
}): FirmwareDeviceConfigPayload {
  const relays = buildRelayHardwareMap(params.relays);
  const roleByPort = Object.fromEntries(
    params.relays.map((relay) => [relay.relay_port, relayNameToFirmwareRole(relay.name)]),
  ) as Record<number, string>;

  const logic: FirmwareLogicRule[] = [];

  for (const rule of params.activeRules) {
    const role =
      roleByPort[rule.relay_port] ?? relayNameToFirmwareRole(rule.name);
    const firmwareRule = logicConfigToFirmwareRule(
      role,
      rule.logic_config as Record<string, unknown>,
    );
    if (firmwareRule) logic.push(firmwareRule);
  }

  const sensors = params.sensors ?? DEFAULT_SENSORS;

  return {
    data: {
      hardware: {
        sensors: {
          temperature: sensors.temperature ?? DEFAULT_SENSORS.temperature,
          humidity: sensors.humidity ?? DEFAULT_SENSORS.humidity,
          soil_moisture: sensors.soil_moisture ?? DEFAULT_SENSORS.soil_moisture,
          light: sensors.light ?? DEFAULT_SENSORS.light,
        },
        relays,
      },
      logic,
    },
  };
}
