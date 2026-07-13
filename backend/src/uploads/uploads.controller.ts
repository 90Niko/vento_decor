import {
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UploadedImage } from '../infrastructure/storage/cloudinary/cloudinary.service';
import { UploadsService } from './uploads.service';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post('images')
  @UseInterceptors(
    FilesInterceptor('images', MAX_FILES, {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: MAX_FILES },
    }),
  )
  async uploadImages(
    @UploadedFiles(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE }),
          new FileTypeValidator({
            fileType: /^image\/(jpeg|png|webp|gif|avif|heic|heif|svg\+xml)$/,
            fallbackToMimetype: true,
            errorMessage:
              'Файлът трябва да бъде JPG, PNG, WebP, GIF, AVIF, HEIC, HEIF или SVG изображение.',
          }),
        ],
      }),
    )
    files: Express.Multer.File[],
  ): Promise<{ images: UploadedImage[] }> {
    return { images: await this.uploadsService.uploadImages(files) };
  }
}
