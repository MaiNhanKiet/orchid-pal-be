import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiCreateZoneDocs() {
    return applyDecorators(
        ApiOperation({
            summary: 'Bước 3 - Tạo Hồ sơ Vườn (Khu vực trồng)',
            description:
                'Người dùng (đã đăng nhập) tạo một planting_zone mới để gắn thiết bị vào đó. user_id được lấy từ JWT (CurrentUser), client chỉ gửi thông tin vườn. API này sẽ INSERT vào bảng planting_zones và trả về zone_id cho App lưu tạm.',
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
                    errors: ['name should not be empty', 'location_city should not be empty'],
                },
            },
        }),
    );
}

