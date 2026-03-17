import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetZonesDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy danh sách Zones của người dùng hiện tại',
      description:
        'Trả về tất cả planting_zones thuộc về user đang đăng nhập (lấy user_id từ JWT). ' +
        'Dùng để kiểm tra người dùng đã có zone nào chưa trước khi tạo mới.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Danh sách zones của user.',
      schema: {
        example: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            user_id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Vườn lan nhà tôi',
            location_city: 'Hà Nội',
            exposure: 'FULL_SUN',
            image_url: null,
            created_at: '2024-01-01T00:00:00.000Z',
          },
        ],
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Người dùng chưa có khu vườn nào.',
      schema: {
        example: {
          statusCode: 404,
          message: 'Người dùng chưa có khu vườn nào',
        },
      },
    }),
  );
}

export function ApiCreateZoneDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bước 3 - Tạo Hồ sơ Vườn (Khu vực trồng)',
      description:
        '**Bước thứ ba trong quy trình kích hoạt thiết bị.**\n\n' +
        'Sau khi thiết bị đã ONLINE (Bước 2), người dùng tạo một planting_zone mới để gắn thiết bị vào đó. ' +
        'user_id được lấy từ JWT (CurrentUser), client chỉ gửi thông tin vườn (tên, vị trí, exposure, v.v.).\n\n' +
        'API này sẽ INSERT vào bảng planting_zones và trả về zone_id cho App lưu tạm để dùng cho các bước tiếp theo.\n\n' +
        '**Kết quả:** Có zone_id để tiếp tục Bước 4.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 201,
      description: 'Tạo vườn thành công. Trả về zone_id.',
      schema: {
        example: {
          zone_id: '123e4567-e89b-12d3-a456-426614174000',
          id: '123e4567-e89b-12d3-a456-426614174000',
          user_id: '123e4567-e89b-12d3-a456-426614174001',
          name: 'Vườn lan nhà tôi',
          location_city: 'Hà Nội',
          exposure: 'FULL_SUN',
          image_url: null,
          created_at: '2024-01-01T00:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ.',
      schema: {
        example: {
          message: 'Bad Request',
          errors: [
            'name should not be empty',
            'location_city should not be empty',
          ],
        },
      },
    }),
  );
}

export function ApiGetZoneDetailDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy chi tiết Zone',
      description:
        'Lấy thông tin chi tiết của một khu vườn, bao gồm cây, thiết bị và automation rules.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Thông tin chi tiết khu vườn',
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy khu vườn',
    }),
  );
}

export function ApiGetZoneAutomationRulesDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy cấu hình Automation Rules hiện tại',
      description:
        'Trả về automation rule đang active của zone để hiển thị lên form edit.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Cấu hình automation rule.',
      schema: {
        example: {
          id: 'uuid',
          zone_id: 'uuid',
          name: 'Manual Update',
          is_active: true,
          logic_config: [
            {
              if: { metric: 'humidity', op: '<', value: 40 },
              then: { action: 'pump', duration_ms: 10000 },
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy hoặc chưa có rule nào.',
    }),
  );
}

export function ApiUpdateAutomationRulesDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cập nhật Automation Rules cho Zone',
      description:
        'Cập nhật logic tự động hóa (rules) cho thiết bị trong khu vườn. ' +
        'Logic sẽ được gửi xuống ESP32 thông qua MQTT. ' +
        'Lưu ý: API này sẽ tắt các rules cũ và tạo rules mới. Đồng thời reload lại hardware config trên thiết bị.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Cập nhật thành công.',
      schema: {
        example: {
          message: 'Automation rules updated and sent to devices.',
          rule_id: '123e4567-e89b-12d3-a456-426614174000',
        },
      },
    }),
  );
}
