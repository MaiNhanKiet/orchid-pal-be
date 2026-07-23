import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

export function ApiUpdateAutomationRulesDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cập nhật automation rule cho relay',
      description: 'Gửi config xuống Kit qua MQTT sau khi lưu DB.',
    }),
    ApiAuthFailures(),
    ApiParam({ name: 'deviceId', description: 'Device UUID' }),
    ApiParam({ name: 'relayPort', description: 'Cổng relay (1 — PUMP)' }),
    ApiBody({
      schema: {
        example: {
          logic: {
            moisture_min: 40,
            water_duration_ms: 15000,
            cooldown_ms: 15000,
            enabled: true,
          },
        },
        description:
          'Backend accepts pump threshold logic (moisture_min/water_duration_ms) or firmware rule shape (if/then). MQTT config is always published as ESP32 `{ data: { hardware, logic } }`.',
      },
    }),
    ApiResponse({ status: 200, description: 'Cập nhật rule thành công' }),
  );
}

export function ApiRefreshAutomationByPlantDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Refresh automation từ AI thresholds của cây',
      description: 'Tái tạo rules từ `ai_suggested_thresholds` khi gắn Kit hoặc sau khi phân tích AI.',
    }),
    ApiAuthFailures(),
    ApiParam({ name: 'plantId', description: 'Plant UUID' }),
    ApiResponse({ status: 200, description: 'Đã refresh và push config xuống Kit' }),
  );
}

export function ApiActivateAutomationRuleDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Activate an inactive automation rule',
      description: 'Sets the rule active, deactivates others on the same relay, and pushes MQTT config.',
    }),
    ApiAuthFailures(),
    ApiParam({ name: 'ruleId', description: 'Automation rule UUID' }),
    ApiResponse({ status: 200, description: 'Rule activated' }),
  );
}

export function ApiDeleteAutomationRuleDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Delete an inactive automation rule',
      description: 'Only inactive rules can be deleted.',
    }),
    ApiAuthFailures(),
    ApiParam({ name: 'ruleId', description: 'Automation rule UUID' }),
    ApiResponse({ status: 200, description: 'Rule deleted' }),
  );
}
