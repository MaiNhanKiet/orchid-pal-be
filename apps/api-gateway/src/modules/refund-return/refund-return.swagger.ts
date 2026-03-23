import { applyDecorators } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';

export const ApiRequestReturnDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Yêu cầu trả hàng',
      description:
        'User gửi yêu cầu trả hàng sau khi đơn đã COMPLETED. Với đơn COD cần cung cấp thông tin ngân hàng.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['orderId', 'reason'],
        properties: {
          orderId: { type: 'string', format: 'uuid', description: 'ID đơn hàng' },
          reason: { type: 'string', description: 'Lý do trả hàng' },
          images: {
            type: 'array',
            items: { type: 'string' },
            description: 'URL ảnh bằng chứng',
          },
          refund_bank_info: {
            type: 'object',
            description: 'Bắt buộc nếu COD',
            properties: {
              bank_name: { type: 'string', example: 'Vietcombank' },
              account_number: { type: 'string', example: '0123456789' },
              account_holder: { type: 'string', example: 'NGUYEN VAN A' },
            },
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Yêu cầu trả hàng đã được gửi thành công' }),
    ApiResponse({ status: 400, description: 'Đơn không đủ điều kiện trả hàng' }),
    ApiResponse({ status: 403, description: 'Không có quyền thao tác trên đơn này' }),
  );

export const ApiApproveReturnDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: '[Manager] Approve return request',
      description:
        'Duyệt yêu cầu trả hàng. Order → RETURNING, Transaction → REFUNDING. Lệnh lấy hàng về kho sẽ do Shop thao tác thủ công với ĐVVC.',
    }),
    ApiParam({ name: 'id', description: 'Return Request ID' }),
    ApiResponse({ status: 201, description: 'Đã phê duyệt' }),
    ApiResponse({ status: 400, description: 'Return request đã được xử lý' }),
  );

export const ApiRejectReturnDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: '[Manager] Reject return request',
      description: 'Từ chối yêu cầu trả hàng. Order trở về COMPLETED.',
    }),
    ApiParam({ name: 'id', description: 'Return Request ID' }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['note'],
        properties: {
          note: { type: 'string', description: 'Lý do từ chối' },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Đã từ chối yêu cầu trả hàng' }),
  );

export const ApiConfirmReceivedDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: '[Manager] Xác nhận đã nhận hàng về kho',
      description: 'Order: RETURNING → RETURNED.',
    }),
    ApiParam({ name: 'id', description: 'Return Request ID' }),
    ApiResponse({ status: 201, description: 'Đã xác nhận nhận hàng' }),
    ApiResponse({ status: 400, description: 'Đơn không ở trạng thái RETURNING' }),
  );

export const ApiConfirmRefundedDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: '[Manager] Xác nhận đã chuyển tiền hoàn',
      description:
        'Transaction: REFUNDING → REFUNDED. Response trả về refund_bank_info để đối chiếu.',
    }),
    ApiParam({ name: 'id', description: 'Return Request ID' }),
    ApiResponse({ status: 201, description: 'Đã xác nhận hoàn tiền thành công' }),
    ApiResponse({ status: 400, description: 'Transaction không ở trạng thái REFUNDING' }),
  );

export const ApiGetAllReturnRequestsDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: '[Manager] Lấy tất cả return requests',
    }),
    ApiQuery({
      name: 'status',
      required: false,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      description: 'Lọc theo trạng thái',
    }),
    ApiResponse({ status: 200, description: 'Danh sách return requests' }),
  );

export const ApiGetMyReturnRequestsDocs = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Xem lịch sử return request của tôi',
    }),
    ApiResponse({ status: 200, description: 'Danh sách return requests của user' }),
  );
