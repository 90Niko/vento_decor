import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Redirect,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';

@Controller('admin/event-images')
export class AdminEventImagesController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get(':imageId/download')
  @Redirect()
  async download(
    @Param('imageId', ParseIntPipe) imageId: number,
  ): Promise<{ url: string }> {
    return {
      url: await this.uploadsService.getEventImageDownloadUrl(imageId),
    };
  }

  @Delete(':imageId')
  async delete(
    @Param('imageId', ParseIntPipe) imageId: number,
  ): Promise<{ deleted: true }> {
    await this.uploadsService.deleteEventImage(imageId);
    return { deleted: true };
  }
}
