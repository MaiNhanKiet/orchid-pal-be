import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  uploadChatImage(buffer: Buffer, folder: string): Promise<string> {
    return this.uploadImage(buffer, folder);
  }

  uploadImage(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve(result.secure_url);
        },
      );

      stream.end(buffer);
    });
  }

  uploadBlogCover(buffer: Buffer, userId: string): Promise<string> {
    return this.uploadImage(buffer, `expert-blog/${userId}`);
  }

  uploadKitQrImage(buffer: Buffer, deviceId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'kit-qr',
          public_id: deviceId,
          overwrite: true,
          resource_type: 'image',
        },
        (error, result) => {
          if (error || !result?.secure_url) {
            reject(error ?? new Error('Cloudinary kit QR upload failed'));
            return;
          }
          resolve(result.secure_url);
        },
      );

      stream.end(buffer);
    });
  }

  async deleteChatImage(url: string, userId: string): Promise<void> {
    return this.deleteImage(url, `expert-chat/${userId}/`);
  }

  async deleteBlogCover(url: string, userId: string): Promise<void> {
    return this.deleteImage(url, `expert-blog/${userId}/`);
  }

  async deleteImage(url: string, expectedPrefix: string): Promise<void> {
    const publicId = this.extractPublicId(url);

    if (!publicId || !publicId.startsWith(expectedPrefix)) {
      throw new Error('Invalid image URL or permission denied');
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error('Failed to delete image from Cloudinary');
    }
  }

  private extractPublicId(url: string): string | null {
    const marker = '/upload/';
    const markerIndex = url.indexOf(marker);
    if (markerIndex === -1) return null;

    let path = url.slice(markerIndex + marker.length);
    const parts = path.split('/');

    if (parts[0]?.startsWith('v') && /^\d+$/.test(parts[0].slice(1))) {
      parts.shift();
    }

    const lastPart = parts.at(-1);
    if (!lastPart) return null;

    parts[parts.length - 1] = lastPart.replace(/\.[a-zA-Z0-9]+$/, '');
    return parts.join('/');
  }
}
