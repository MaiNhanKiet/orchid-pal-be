import { ApiAuthFailures } from '@app/common';
import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export function ApiActivateDeviceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Bước 1 - Kích hoạt thiết bị (gán chủ sở hữu)',
      description:
        'Bước đầu tiên trong quy trình đưa thiết bị vào hệ thống.\n\n' +
        '- App/mobile quét QR code trên thiết bị để lấy `serial_number` và `secret_key`.\n' +
        '- Gửi 2 thông tin này lên API, `user_id` sẽ được lấy tự động từ JWT của người dùng đang đăng nhập.\n\n' +
        '**Khi thành công:**\n' +
        '- Thiết bị được gán `owner_id` là người dùng hiện tại.\n' +
        '- Trạng thái khởi tạo của thiết bị là `OFFLINE`.',
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
              message: 'Secret key không đúng. Vui lòng kiểm tra lại QR code.',
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
      summary: 'Bước 2 - Kiểm tra trạng thái thiết bị (polling)',
      description:
        'Sau khi đã cấu hình WiFi cho ESP32, app sẽ định kỳ gọi API này với `serial_number` để kiểm tra thiết bị đã sẵn sàng hay chưa.\n\n' +
        '- Trạng thái thiết bị được cập nhật realtime từ ESP32 thông qua MQTT (topic: `device/+/status`).\n' +
        '- App chỉ cần truyền đúng `serial_number` để lấy về `status` và `last_online_at`.\n\n' +
        '**Khi status = ONLINE:** app có thể tiếp tục sang các bước cấu hình tiếp theo (tạo vườn, gán thiết bị, v.v.).',
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

export function ApiGetLatestDeviceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy thiết bị mới nhất đã gán vào zone có trồng cây',
      description:
        'API này trả về thông tin thiết bị, vườn, và cây của thiết bị MỚI NHẤT (dựa trên thời gian tạo) mà user sở hữu.\n\n' +
        'Điều kiện:\n' +
        '- Thiết bị thuộc về user.\n' +
        '- Thiết bị đã được gán vào một `zone`.\n' +
        '- Zone đó đã có ít nhất một `my_plant`.\n\n' +
        'Dữ liệu trả về bao gồm thông tin chi tiết của Device, Zone và danh sách Plants trong zone đó.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Tìm thấy thiết bị thỏa mãn điều kiện.',
      schema: {
        example: {
          device: {
            id: 'device-uuid',
            serial_number: 'SN-123456',
            status: 'ONLINE',
            last_online_at: '2025-01-01T12:00:00Z',
            created_at: '2025-01-01T10:00:00Z',
          },
          zone: {
            id: 'zone-uuid',
            name: 'Ban công tầng 2',
            exposure: 'SUNNY',
            image_url: 'http://example.com/zone.jpg',
          },
          plants: [
            {
              id: 'plant-uuid',
              nickname: 'Lan Hồ Điệp',
              species_id: 'species-uuid',
              planted_at: '2025-01-01',
              health_status: 'GOOD',
              image_url: 'http://example.com/plant.jpg',
            },
          ],
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Không tìm thấy thiết bị nào phù hợp.',
    }),
  );
}

export function ApiAssignDeviceToPlantDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Gắn Kit vào cây (1:1)',
      description:
        'Bước cuối kích hoạt: gán thiết bị vào đúng 1 cây. Mỗi cây chỉ có tối đa 1 Kit.\n\n' +
        'Sau khi gắn, hệ thống tự tạo automation rules từ `ai_suggested_thresholds` của cây.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Gắn Kit vào cây thành công.',
      schema: {
        example: {
          message: 'Gắn Kit vào cây thành công',
          device: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            serial_number: 'GROWPAL-KIT-001',
            owner_id: '123e4567-e89b-12d3-a456-426614174001',
            plant_id: '123e4567-e89b-12d3-a456-426614174100',
            status: 'ONLINE',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ (plant_id không phải UUID, cây đã có Kit, v.v.).',
    }),
    ApiResponse({
      status: 403,
      description: 'Thiết bị không thuộc về user hiện tại.',
    }),
    ApiResponse({
      status: 404,
      description: 'Thiết bị hoặc cây không tồn tại.',
    }),
  );
}

/** @deprecated */
export const ApiAssignDeviceToZoneDocs = ApiAssignDeviceToPlantDocs;

export function ApiControlDeviceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Điều khiển relay thủ công theo role',
      description:
        'Gửi lệnh điều khiển relay thủ công (ON/OFF) theo role của relay đã cấu hình.\n\n' +
        '- API sẽ kiểm tra thiết bị có relay tương ứng role hay không.\n' +
        '- Nếu hợp lệ, hệ thống sẽ emit event `send_manual_control` tới Automation Service để bắn xuống ESP32 qua MQTT.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Gửi lệnh điều khiển relay thành công.',
      schema: {
        example: {
          message: 'Đã gửi lệnh điều khiển relay',
          payload: {
            serial_number: 'SN-1234567890',
            relay_number: 1,
            role: 'pump',
            action: 'ON',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ hoặc relay chưa được cấu hình role.',
      schema: {
        examples: {
          invalidData: {
            value: {
              message: 'Bad Request',
              errors: [
                'role should not be empty',
                'action should not be empty',
              ],
            },
          },
          relayNotConfigured: {
            value: {
              message: 'Thiết bị chưa cấu hình relay cho role này.',
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

/**
 * API 1: Thêm mới thiết bị vào hệ thống (Import Device)
 */
export function ApiImportDeviceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Admin - Thêm mới thiết bị vào hệ thống (Import Device)',
      description:
        'API dùng cho quản trị viên để nhập kho thiết bị mới.\n\n' +
        '- Thiết bị mới chỉ tồn tại trong kho, **chưa gắn với người dùng nào** (`owner_id = null`).\n' +
        '- Trạng thái mặc định là `INACTIVE` cho đến khi người dùng quét QR và kích hoạt.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 201,
      description: 'Tạo mới thiết bị thành công.',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          serial_number: 'SN-ORCHID-0001',
          secret_key: 'SECRET-KEY-0001',
          product_id: '123e4567-e89b-12d3-a456-426614174100',
          owner_id: null,
          zone_id: null,
          status: 'INACTIVE',
          current_firmware: 'v1.0.0',
          created_at: '2025-01-01T12:34:56.789Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ hoặc serial_number đã tồn tại.',
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
          duplicateSerial: {
            value: {
              message: 'Serial number đã tồn tại',
            },
          },
        },
      },
    }),
  );
}

/**
 * API 2: Xem danh sách tổng quan thiết bị (Get All Devices)
 */
export function ApiGetAllDevicesDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Admin - Xem danh sách tổng quan thiết bị',
      description:
        'API trả về danh sách thiết bị trong hệ thống, phục vụ màn hình overview cho admin.\n\n' +
        'Hỗ trợ:\n' +
        '- Phân trang (`page`, `limit`).\n' +
        '- Lọc theo `serial_number`, `status`, `owner_id`, `zone_id`, `product_id`.\n' +
        '- Sắp xếp theo `created_at`, `serial_number`, `status`, `last_online_at`.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách thiết bị thành công.',
      schema: {
        example: {
          data: [
            {
              id: '123e4567-e89b-12d3-a456-426614174000',
              serial_number: 'SN-ORCHID-0001',
              status: 'ONLINE',
              owner_id: '123e4567-e89b-12d3-a456-426614174001',
              zone_id: '123e4567-e89b-12d3-a456-426614174100',
              product_id: '123e4567-e89b-12d3-a456-426614174200',
              current_firmware: 'v1.0.1',
              last_online_at: '2025-01-01T12:34:56.789Z',
              created_at: '2024-12-01T08:00:00.000Z',
            },
          ],
          meta: {
            page: 1,
            limit: 10,
            total: 25,
            totalPages: 3,
          },
        },
      },
    }),
  );
}

/**
 * API 3: Xem chi tiết trạng thái 1 thiết bị (Device Detail & Diagnostic)
 */
export function ApiGetDeviceDetailDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Admin - Xem chi tiết & chẩn đoán một thiết bị',
      description:
        'API trả về đầy đủ thông tin chi tiết của một thiết bị, phục vụ kiểm tra và chẩn đoán.\n\n' +
        'Bao gồm: định danh, sản phẩm, chủ sở hữu, vườn, liên kết master, firmware và các mốc thời gian quan trọng.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy chi tiết thiết bị thành công.',
      schema: {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          serial_number: 'SN-ORCHID-0001',
          product_id: '123e4567-e89b-12d3-a456-426614174200',
          owner_id: '123e4567-e89b-12d3-a456-426614174001',
          zone_id: '123e4567-e89b-12d3-a456-426614174100',
          linked_master_id: null,
          status: 'ONLINE',
          current_firmware: 'v1.0.1',
          last_online_at: '2025-01-01T12:34:56.789Z',
          created_at: '2024-12-01T08:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Thiết bị không tồn tại.',
      schema: {
        example: {
          message: 'Thiết bị không tồn tại',
        },
      },
    }),
  );
}

/**
 * API 4b: Admin gán Kit cho người dùng (Assign Device To User)
 */
export function ApiAssignDeviceToUserDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Admin - Gán Kit cho người dùng',
      description:
        'Gán quyền sở hữu Kit cho người dùng mà không cần quét QR.\n\n' +
        '- Chỉ áp dụng khi Kit chưa có chủ (`owner_id = null`).\n' +
        '- Trạng thái chuyển sang `OFFLINE` (chờ người dùng cấu hình WiFi).\n' +
        '- Dùng sau khi `force-unbind` để gán lại Kit cho người dùng khác.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Gán Kit cho người dùng thành công.',
      schema: {
        example: {
          message: 'Đã gán Kit cho người dùng',
          device: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            serial_number: 'GP-ESP32-001',
            owner_id: '123e4567-e89b-12d3-a456-426614174001',
            status: 'OFFLINE',
            activated_at: '2025-01-01T12:34:56.789Z',
          },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Kit đã có chủ hoặc dữ liệu không hợp lệ.',
    }),
    ApiResponse({
      status: 404,
      description: 'Kit hoặc người dùng không tồn tại.',
    }),
  );
}

/**
 * API 4: Buộc thu hồi / Hủy liên kết thiết bị (Force Unbind Device)
 */
export function ApiForceUnbindDeviceDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Admin - Buộc thu hồi / Hủy liên kết thiết bị',
      description:
        'API cho phép quản trị viên gỡ liên kết thiết bị khỏi người dùng/vườn hiện tại trong các trường hợp đặc biệt.\n\n' +
        'Hành vi điển hình:\n' +
        '- Đặt `owner_id`, `zone_id`, `linked_master_id` về `null`.\n' +
        '- (Tuỳ theo chính sách) có thể đưa `status` về `INACTIVE` hoặc một trạng thái thu hồi khác.\n' +
        '- Có thể mở rộng để ghi lại lý do thu hồi phục vụ audit/log sau này.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Thu hồi / hủy liên kết thiết bị thành công.',
      schema: {
        example: {
          message: 'Thiết bị đã được thu hồi khỏi người dùng và vườn hiện tại.',
          device: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            serial_number: 'SN-ORCHID-0001',
            owner_id: null,
            zone_id: null,
            linked_master_id: null,
            status: 'INACTIVE',
          },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Thiết bị không tồn tại.',
      schema: {
        example: {
          message: 'Thiết bị không tồn tại',
        },
      },
    }),
  );
}

export function ApiGetDeviceLogsDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy log hoạt động của thiết bị',
      description:
        'Trả về các log tự động hóa và điều khiển thủ công của thiết bị, theo phân trang.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy danh sách log thành công.',
    }),
  );
}

export function ApiGetDeviceActivationQrDocs() {
  return applyDecorators(
    ApiOperation({
      summary: 'Lấy ảnh QR kích hoạt kit',
      description:
        'Trả về URL ảnh QR trên Cloudinary. Nếu kit chưa có ảnh, hệ thống sẽ generate, upload và lưu vào DB.',
    }),
    ApiAuthFailures(),
    ApiResponse({
      status: 200,
      description: 'Lấy QR kích hoạt thành công.',
      schema: {
        example: {
          device_id: '123e4567-e89b-12d3-a456-426614174000',
          serial_number: 'GP-ESP32-001',
          activation_payload: 'plantpal://activate?id=device-uuid&key=ABC123',
          qr_image_url: 'https://res.cloudinary.com/demo/image/upload/v1/kit-qr/device-uuid.png',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Thiết bị không tồn tại.',
    }),
  );
}
