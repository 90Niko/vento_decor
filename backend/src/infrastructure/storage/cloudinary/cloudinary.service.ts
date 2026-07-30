import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2 as cloudinary,
} from 'cloudinary';

export interface UploadedImage {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  originalName: string;
  resourceType: 'image' | 'video';
}

@Injectable()
export class CloudinaryService {
  constructor(configService: ConfigService) {
    cloudinary.config({
      cloud_name: configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
      secure: true,
    });
  }

  uploadImage(file: Express.Multer.File): Promise<UploadedImage> {
    return new Promise((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: 'vento-decor',
          resource_type: 'auto',
          unique_filename: true,
          overwrite: false,
        },
        (
          error: UploadApiErrorResponse | undefined,
          result: UploadApiResponse | undefined,
        ) => {
          if (error) {
            reject(
              new InternalServerErrorException(
                'Качването на снимката в облачното хранилище е неуспешно.',
              ),
            );
            return;
          }

          if (!result) {
            reject(
              new InternalServerErrorException(
                'Облачното хранилище не върна резултат от качването.',
              ),
            );
            return;
          }

          resolve({
            publicId: result.public_id,
            url: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
            originalName: file.originalname,
            resourceType: result.resource_type === 'video' ? 'video' : 'image',
          });
        },
      );

      upload.end(file.buffer);
    });
  }

  async deleteImage(
    publicId: string,
    resourceType: 'image' | 'video' = 'image',
  ): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  }

  getDownloadUrl(imageUrl: string): string {
    return imageUrl.replace('/upload/', '/upload/fl_attachment/');
  }
}
