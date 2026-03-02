import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiCreateMyPlantDocs() {
    return applyDecorators(
        ApiOperation({
            summary: 'Bước 4 - Chọn giống Lan & Trồng Cây',
            description:
                'Người dùng chọn species_id (từ danh mục species_wiki) và zone_id (từ Bước 3) để trồng một chậu lan mới. ' +
                'Hệ thống sẽ kiểm tra quyền sở hữu zone (zone thuộc user hiện tại) và tồn tại của species, sau đó INSERT bản ghi vào my_plants và trả về plant_id.',
        }),
        ApiAuthFailures(),
        ApiResponse({
            status: 201,
            description: 'Trồng cây thành công, trả về plant_id và thông tin chậu cây.',
            schema: {
                example: {
                    plant_id: '123e4567-e89b-12d3-a456-426614174abc',
                    id: '123e4567-e89b-12d3-a456-426614174abc',
                    user_id: '123e4567-e89b-12d3-a456-426614174999',
                    zone_id: '123e4567-e89b-12d3-a456-426614174000',
                    species_id: '123e4567-e89b-12d3-a456-426614174111',
                    nickname: 'Cô nàng Hồ Điệp số 1',
                    planted_at: '2025-01-01T00:00:00.000Z',
                    health_status: 'GOOD',
                    image_url: 'https://example.com/my-orchid.jpg',
                    created_at: '2025-01-01T00:00:00.000Z',
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Dữ liệu không hợp lệ (zone_id/species_id không đúng định dạng, vv.).',
            schema: {
                example: {
                    message: 'Bad Request',
                    errors: [
                        'zone_id must be a UUID',
                        'species_id must be a UUID',
                    ],
                },
            },
        }),
        ApiResponse({
            status: 403,
            description: 'Zone không thuộc về user hiện tại.',
            schema: {
                example: {
                    message: 'Bạn không có quyền trồng cây trong khu vườn này.',
                },
            },
        }),
        ApiResponse({
            status: 404,
            description: 'Zone hoặc Species không tồn tại.',
            schema: {
                example: {
                    message: 'Zone not found',
                },
            },
        }),
    );
}

