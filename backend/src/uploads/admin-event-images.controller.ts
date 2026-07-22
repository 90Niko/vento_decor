import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Redirect,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { CreatorAuthGuard } from '../modules/auth/creator-auth.guard';
import type { Request } from 'express';
import { CreatorSession } from '../modules/auth/auth.service';

@Controller('admin/event-images')
@UseGuards(CreatorAuthGuard)
export class AdminEventImagesController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Get(':imageId/download')
  @Redirect()
  async download(
    @Param('imageId', ParseIntPipe) imageId: number,
    @Req() req: Request & { creator: CreatorSession },
  ): Promise<{ url: string }> {
    return {
      url: await this.uploadsService.getEventImageDownloadUrl(
        imageId,
        req.creator,
      ),
    };
  }

  @Delete(':imageId')
  async delete(
    @Param('imageId', ParseIntPipe) imageId: number,
    @Req() req: Request & { creator: CreatorSession },
  ): Promise<{ deleted: true }> {
    await this.uploadsService.deleteEventImage(imageId, req.creator);
    return { deleted: true };
  }
}
