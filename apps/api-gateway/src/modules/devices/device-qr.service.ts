import {
  DeviceActivationQrResponseDto,
  MICROSERVICES_CLIENTS,
} from '@app/common';
import { GrpcRpcService } from '@app/grpc';
import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { CloudinaryService } from '../../expert-consultation/cloudinary.service';

type DeviceQrRecord = {
  id: string;
  serial_number: string;
  secret_key: string;
  qr_image_url?: string | null;
};

@Injectable()
export class DeviceQrService {
  constructor(
    private readonly grpcRpc: GrpcRpcService,
    private readonly cloudinary: CloudinaryService,
  ) {}

  buildActivationPayload(deviceId: string, secretKey: string): string {
    const params = new URLSearchParams({
      id: deviceId,
      key: secretKey,
    });
    return `plantpal://activate?${params.toString()}`;
  }

  private async generateQrBuffer(payload: string): Promise<Buffer> {
    return QRCode.toBuffer(payload, {
      type: 'png',
      width: 480,
      margin: 2,
      color: {
        dark: '#14281d',
        light: '#fdfcf8',
      },
    });
  }

  async uploadQrForDevice(device: DeviceQrRecord): Promise<string> {
    const payload = this.buildActivationPayload(device.id, device.secret_key);
    const buffer = await this.generateQrBuffer(payload);
    return this.cloudinary.uploadKitQrImage(buffer, device.id);
  }

  async ensureDeviceHasQr<T extends DeviceQrRecord>(device: T): Promise<T> {
    const qr_image_url = await this.uploadQrForDevice(device);
    const updated = await this.grpcRpc.send<T>(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'update_device',
      { id: device.id, qr_image_url },
    );

    return { ...device, ...updated, qr_image_url };
  }

  async getActivationQr(deviceId: string): Promise<DeviceActivationQrResponseDto> {
    const device = await this.grpcRpc.send<DeviceQrRecord>(
      MICROSERVICES_CLIENTS.PLANT_SERVICE,
      'get_device_by_id',
      deviceId,
    );

    const withQr = await this.ensureDeviceHasQr(device);
    const activation_payload = this.buildActivationPayload(
      withQr.id,
      withQr.secret_key,
    );

    return {
      device_id: withQr.id,
      serial_number: withQr.serial_number,
      activation_payload,
      qr_image_url: withQr.qr_image_url!,
    };
  }
}
