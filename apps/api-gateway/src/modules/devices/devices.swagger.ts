import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiActivateDeviceDocs() {
    return applyDecorators(
        ApiOperation({
            summary: 'Kích hoạt thiết bị (Nhận chủ)',
            description:
                'Người dùng quét QR code trên thiết bị để kích hoạt và nhận làm chủ thiết bị. Yêu cầu: serial_number và secret_key từ QR code. user_id sẽ được lấy tự động từ JWT token của người dùng đang đăng nhập.',
        }),
        ApiAuthFailures(),
        ApiResponse({
            status: 200,
            description: 'Kích hoạt thiết bị thành công.',
            schema: {
                example: {
                    message: 'Kích hoạt thiết bị thành công',
                    device: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        serial_number: 'SN-1234567890',
                        owner_id: '123e4567-e89b-12d3-a456-426614174001',
                        status: 'OFFLINE',
                    },
                },
            },
        }),
        ApiResponse({
            status: 401,
            description: 'Chưa đăng nhập hoặc token không hợp lệ.',
            schema: {
                example: {
                    message: 'Token is missing',
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Dữ liệu không hợp lệ hoặc thiết bị đã có chủ.',
            schema: {
                examples: {
                    invalidData: {
                        value: {
                            message: 'Bad Request',
                            errors: [
                                'serial_number should not be empty',
                                'secret_key must be a string',
                            ],
                        },
                    },
                    deviceAlreadyOwned: {
                        value: {
                            message: 'Thiết bị đã có chủ. Không thể kích hoạt lại.',
                        },
                    },
                    invalidSecretKey: {
                        value: {
                            message:
                                'Secret key không đúng. Vui lòng kiểm tra lại QR code.',
                        },
                    },
                },
            },
        }),
        ApiResponse({
            status: 404,
            description: 'Thiết bị không tồn tại.',
            schema: {
                example: {
                    message:
                        'Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.',
                },
            },
        }),
    );
}

export function ApiGetDeviceStatusDocs() {
    return applyDecorators(
        ApiOperation({
            summary: 'Kiểm tra trạng thái thiết bị sau khi cấu hình WiFi (Polling)',
            description:
                'App mobile gọi API này liên tục với serial_number để kiểm tra xem thiết bị đã ONLINE hay chưa. Dữ liệu được cập nhật realtime qua MQTT worker từ ESP32.',
        }),
        ApiAuthFailures(),
        ApiResponse({
            status: 200,
            description:
                'Lấy thành công trạng thái hiện tại của thiết bị theo serial_number.',
            schema: {
                example: {
                    serial_number: 'SN-1234567890',
                    status: 'ONLINE',
                    last_online_at: '2025-01-01T12:34:56.789Z',
                },
            },
        }),
        ApiResponse({
            status: 404,
            description: 'Thiết bị không tồn tại.',
            schema: {
                example: {
                    message:
                        'Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.',
                },
            },
        }),
    );
}

export function ApiAssignDeviceToZoneDocs() {
    return applyDecorators(
        ApiOperation({
            summary: 'Bước 5 - Gán Thiết bị vào Vườn',
            description:
                'Sau khi đã có vườn (zone) và thiết bị đã kích hoạt, API này cho phép gán thiết bị vào một zone cụ thể. ' +
                'Hệ thống sẽ kiểm tra quyền sở hữu thiết bị (owner_id trùng với user hiện tại) rồi cập nhật devices.zone_id.',
        }),
        ApiAuthFailures(),
        ApiResponse({
            status: 200,
            description: 'Gán thiết bị vào vườn thành công.',
            schema: {
                example: {
                    message: 'Gán thiết bị vào vườn thành công',
                    device: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        serial_number: 'SN-1234567890',
                        owner_id: '123e4567-e89b-12d3-a456-426614174001',
                        zone_id: '123e4567-e89b-12d3-a456-426614174100',
                        status: 'ONLINE',
                    },
                },
            },
        }),
        ApiResponse({
            status: 400,
            description: 'Dữ liệu không hợp lệ (zone_id không phải UUID, v.v.).',
            schema: {
                example: {
                    message: 'Bad Request',
                    errors: ['zone_id must be a UUID'],
                },
            },
        }),
        ApiResponse({
            status: 403,
            description: 'Thiết bị không thuộc về user hiện tại.',
            schema: {
                example: {
                    message: 'Bạn không có quyền gán thiết bị này vào vườn.',
                },
            },
        }),
        ApiResponse({
            status: 404,
            description: 'Thiết bị không tồn tại.',
            schema: {
                example: {
                    message:
                        'Thiết bị không tồn tại. Vui lòng kiểm tra lại serial number.',
                },
            },
        }),
    );
}