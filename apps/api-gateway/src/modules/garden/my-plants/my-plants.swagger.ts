import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiCreateMyPlantDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bước 4 - Chọn giống Lan & Trồng Cây',
      description:
        '**Bước thứ tư trong quy trình kích hoạt thiết bị.**\n\n' +
        'Sau khi đã có vườn (zone_id từ Bước 3), người dùng chọn species_id (từ danh mục species_wiki - gọi GET /species) ' +
        'để trồng một chậu lan mới vào vườn đó.\n\n' +
        'Hệ thống sẽ:\n' +
        '1. Kiểm tra quyền sở hữu zone (zone thuộc user hiện tại)\n' +
        '2. Validate species tồn tại trong species_wiki\n' +
        '3. INSERT bản ghi vào my_plants\n\n' +
        '**Kết quả:** Có plant_id, sẵn sàng cho Bước 5 (gán thiết bị vào vườn).',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 201,
      description:
        'Trồng cây thành công, trả về plant_id và thông tin chậu cây.',
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
      description:
        'Dữ liệu không hợp lệ (zone_id/species_id không đúng định dạng, vv.).',
      schema: {
        example: {
          message: 'Bad Request',
          errors: ['zone_id must be a UUID', 'species_id must be a UUID'],
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

export function ApiUpdateMyPlantDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Cập nhật thông tin cây (nickname, image_url)',
      description: 'Chỉ cho phép cập nhật nickname và image_url của cây.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Cập nhật thành công.',
    }),
    ApiResponse({
      status: 404,
      description: 'Plant not found',
    }),
  );
}
