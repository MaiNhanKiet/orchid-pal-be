import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';

export function ApiGetMyPlantsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Danh sách cây của tôi' }),
    ApiAuthFailures(),
    ApiQuery({ name: 'page', required: false, type: Number, example: 1 }),
    ApiQuery({ name: 'limit', required: false, type: Number, example: 10 }),
    ApiResponse({ status: 200, description: 'Danh sách cây kèm Kit (nếu có)' }),
  );
}

export function ApiGetPlantDetailDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Chi tiết cây + Kit + automation rules' }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'Plant UUID' }),
    ApiResponse({ status: 200, description: 'Chi tiết cây' }),
    ApiResponse({ status: 404, description: 'Không tìm thấy cây' }),
  );
}

export function ApiCreatePlantDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Tạo cây mới',
      description: 'Tỷ lệ 1:1 — mỗi cây tương ứng tối đa 1 Kit IoT.',
    }),
    ApiAuthFailures(),
    ApiBody({
      schema: {
        example: {
          nickname: 'Chậu lan Phalaenopsis',
          species_name: 'Phalaenopsis',
          location_city: 'Đà Nẵng',
          setup_image_url: 'https://res.cloudinary.com/.../setup.jpg',
          planted_at: '2025-06-01',
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Tạo cây thành công' }),
  );
}

export function ApiUpdatePlantDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Cập nhật thông tin cây' }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'Plant UUID' }),
    ApiResponse({ status: 200, description: 'Cập nhật thành công' }),
  );
}

export function ApiRemovePlantDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Xóa cây',
      description: 'Không xóa được nếu cây đang gắn Kit.',
    }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'Plant UUID' }),
    ApiResponse({ status: 200, description: 'Đã xóa cây' }),
    ApiResponse({ status: 400, description: 'Cây đang gắn Kit' }),
  );
}

export function ApiAnalyzePlantSetupDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'AI Vision — phân tích góc đặt cây (Gemini)',
      description:
        'Gửi URL ảnh setup, AI trả về phân tích không gian và ngưỡng tưới tối ưu (`ai_suggested_thresholds`).',
    }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'Plant UUID' }),
    ApiBody({
      schema: {
        example: {
          image_url: 'https://res.cloudinary.com/.../setup.jpg',
          location_city: 'Đà Nẵng',
          species_name: 'Phalaenopsis',
        },
      },
    }),
    ApiResponse({ status: 200, description: 'Phân tích và lưu kết quả AI' }),
  );
}
