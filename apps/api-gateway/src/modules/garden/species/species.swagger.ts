import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiGetAllSpeciesDocs() {
    return applyDecorators(
        ApiOperation({ summary: 'Lấy danh sách từ điển loài Lan (Species Wiki)' }),
        ApiAuthFailures(),
        ApiResponse({
            status: 200,
            description: 'Lấy danh sách từ điển loài Lan thành công.',
            schema: {
                example: {
                    data: [
                        {
                            id: '123e4567-e89b-12d3-a456-426614174000',
                            common_name: 'Phalaenopsis',
                            scientific_name: 'Phalaenopsis amabilis',
                            ideal_temp_min: 20.0,
                            ideal_temp_max: 28.0,
                            ideal_humid_min: 50.0,
                            ideal_humid_max: 70.0,
                            care_instruction: 'Cần ánh sáng gián tiếp, tưới nước 2-3 lần/tuần',
                            image_url: 'https://example.com/phalaenopsis.jpg',
                            author_id: '123e4567-e89b-12d3-a456-426614174001',
                        },
                        {
                            id: '123e4567-e89b-12d3-a456-426614174002',
                            common_name: 'Dendrobium',
                            scientific_name: 'Dendrobium nobile',
                            ideal_temp_min: 18.0,
                            ideal_temp_max: 25.0,
                            ideal_humid_min: 60.0,
                            ideal_humid_max: 80.0,
                            care_instruction: 'Cần nhiều ánh sáng, tưới nước thường xuyên',
                            image_url: 'https://example.com/dendrobium.jpg',
                            author_id: null,
                        },
                    ],
                    meta: {
                        page: 1,
                        limit: 10,
                        total: 50,
                        totalPages: 5,
                    },
                },
            },
        }),
    );
}

export function ApiGetSpeciesByIdDocs() {
    return applyDecorators(
        ApiOperation({ summary: 'Lấy chi tiết một loài Lan theo ID' }),
        ApiAuthFailures(),
        ApiResponse({
            status: 200,
            description: 'Lấy chi tiết loài Lan thành công.',
            schema: {
                example: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    common_name: 'Phalaenopsis',
                    scientific_name: 'Phalaenopsis amabilis',
                    ideal_temp_min: 20.0,
                    ideal_temp_max: 28.0,
                    ideal_humid_min: 50.0,
                    ideal_humid_max: 70.0,
                    care_instruction: 'Cần ánh sáng gián tiếp, tưới nước 2-3 lần/tuần',
                    image_url: 'https://example.com/phalaenopsis.jpg',
                    author_id: '123e4567-e89b-12d3-a456-426614174001',
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'UUID không hợp lệ.',
            schema: { example: { message: 'Invalid UUID format' } },
        }),
        ApiResponse({
            status: 404,
            description: 'Không tìm thấy loài Lan.',
            schema: { example: { message: 'Species not found' } },
        }),
    );
}

