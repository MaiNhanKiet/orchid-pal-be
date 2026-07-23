export const DEVICE_ERROR_CODES = {
  KIT_ALREADY_ACTIVATED: 'KIT_ALREADY_ACTIVATED',
} as const;

export type DeviceErrorCode =
  (typeof DEVICE_ERROR_CODES)[keyof typeof DEVICE_ERROR_CODES];

export interface RpcErrorPayload {
  statusCode: number;
  message: string;
  code?: DeviceErrorCode | string;
}

export function serializeRpcErrorPayload(payload: RpcErrorPayload): string {
  return JSON.stringify(payload);
}

export function parseRpcErrorPayload(raw: string): RpcErrorPayload | null {
  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed) as RpcErrorPayload;
    const statusCode = Number(parsed?.statusCode);
    if (!Number.isNaN(statusCode) && statusCode >= 400 && parsed.message) {
      return {
        statusCode,
        message: parsed.message,
        code: parsed.code,
      };
    }
  } catch {
    const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    try {
      const parsed = JSON.parse(jsonMatch[0]) as RpcErrorPayload;
      const statusCode = Number(parsed?.statusCode);
      if (!Number.isNaN(statusCode) && statusCode >= 400 && parsed.message) {
        return {
          statusCode,
          message: parsed.message,
          code: parsed.code,
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}
