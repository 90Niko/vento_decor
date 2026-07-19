import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Redirect,
  UseGuards,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CreatorAuthGuard } from '../modules/auth/creator-auth.guard';

@Controller('admin/event-images')
@UseGuards(CreatorAuthGuard)
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
