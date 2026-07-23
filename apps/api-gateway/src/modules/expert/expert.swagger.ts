import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

export function ApiCreateConversationDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Mở cuộc hội thoại với chuyên gia' }),
    ApiAuthFailures(),
    ApiBody({
      schema: {
        example: {
          related_plant_id: 'uuid-plant',
          topic: 'Cây bị vàng lá',
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Tạo conversation thành công' }),
  );
}

export function ApiListConversationsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Danh sách hội thoại (customer hoặc expert)' }),
    ApiAuthFailures(),
    ApiQuery({ name: 'role', required: false, enum: ['customer', 'expert'] }),
    ApiResponse({ status: 200, description: 'Danh sách conversations' }),
  );
}

export function ApiGetExpertMessagesDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Lấy tin nhắn trong cuộc hội thoại' }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'Conversation UUID' }),
    ApiResponse({ status: 200, description: 'Danh sách messages' }),
  );
}

export function ApiSendExpertMessageDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Gửi tin nhắn (text + ảnh cây bệnh)' }),
    ApiAuthFailures(),
    ApiParam({ name: 'id', description: 'Conversation UUID' }),
    ApiBody({
      schema: {
        example: {
          content: 'Lá bị đốm nâu, nhờ chuyên gia xem giúp',
          image_urls: ['https://res.cloudinary.com/.../leaf.jpg'],
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Gửi tin nhắn thành công' }),
  );
}

export function ApiListExpertBlogsDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Danh sách blog kiến thức (public)' }),
    ApiResponse({ status: 200, description: 'Blogs đã publish' }),
  );
}

export function ApiGetExpertBlogBySlugDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Chi tiết blog theo slug (public)' }),
    ApiParam({ name: 'slug', description: 'Blog slug' }),
    ApiResponse({ status: 200, description: 'Blog detail' }),
    ApiResponse({ status: 404, description: 'Not found' }),
  );
}

export function ApiCreateExpertBlogDocs() {
  return applyDecorators(
    ApiOperation({ summary: 'Tạo blog (chuyên gia/admin)' }),
    ApiAuthFailures(),
    ApiBody({
      schema: {
        example: {
          title: 'Cách tưới lan mùa mưa',
          slug: 'cach-tuoi-lan-mua-mua',
          summary: 'Hướng dẫn ngắn...',
          content: 'Nội dung chi tiết...',
          is_published: true,
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Tạo blog thành công' }),
  );
}
