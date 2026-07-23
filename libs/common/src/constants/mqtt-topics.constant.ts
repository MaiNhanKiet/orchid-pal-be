/** MQTT topic patterns aligned with OrchidPal ESP32 firmware. */
export const MQTT_DEVICE_TOPIC = {
  status: (serialNumber: string) => `device/${serialNumber}/status`,
  telemetry: (serialNumber: string) => `device/${serialNumber}/telemetry`,
  config: (serialNumber: string) => `device/${serialNumber}/config`,
  message: (serialNumber: string) => `device/${serialNumber}/message`,
  control: (serialNumber: string, relayPort: number) =>
    `device/${serialNumber}/control/${relayPort}`,
  actionLog: (serialNumber: string) => `device/${serialNumber}/action_log`,
} as const;

/** Wildcard subscriptions used by plant-service. */
export const MQTT_DEVICE_SUBSCRIBE = {
  status: 'device/+/status',
  telemetry: 'device/+/telemetry',
  actionLog: 'device/+/action_log',
} as const;

export function extractSerialFromMqttTopic(topic: string): string | null {
  const parts = topic.split('/');
  return parts.length >= 2 && parts[0] === 'device' ? parts[1] : null;
}
