import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { GuestAccessService } from '../modules/events/application/guest-access.service';
import {
  CloudinaryService,
  UploadedImage,
} from '../infrastructure/storage/cloudinary/cloudinary.service';
import {
  EventImagesRepository,
  GuestGalleryImage,
} from './domain/event-images.repository';
import { CreatorSession } from '../modules/auth/auth.service';

export interface UploadedEventImage extends UploadedImage {
  id: number;
  position: number;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly guestAccessService: GuestAccessService,
    private readonly eventImagesRepository: EventImagesRepository,
  ) {}

  uploadImages(files: Express.Multer.File[]): Promise<UploadedImage[]> {
    return Promise.all(
      files.map((file) => this.cloudinaryService.uploadImage(file)),
    );
  }

  async uploadEventImages(
    publicId: string,
    guestToken: string | undefined,
    files: Express.Multer.File[],
  ): Promise<UploadedEventImage[]> {
    const { event, guest } = await this.guestAccessService.authenticate(
      publicId,
      guestToken,
    );
    if (event.uploadDeadline && event.uploadDeadline < new Date()) {
      throw new ForbiddenException('The upload deadline has passed.');
    }
    for (const file of files) {
      if (!hasAllowedFileSignature(file)) {
        throw new BadRequestException(
          `The file "${file.originalname}" does not match an allowed media format.`,
        );
      }
    }
    const uploadResults = await Promise.allSettled(
      files.map((file) => this.cloudinaryService.uploadImage(file)),
    );
    const uploaded = uploadResults.flatMap((result) =>
      result.status === 'fulfilled' ? [result.value] : [],
    );

    if (uploaded.length !== files.length) {
      await this.cleanupImages(uploaded);
      throw new ServiceUnavailableException(
        'Една или повече снимки не можаха да бъдат качени.',
      );
    }

    try {
      const persisted = await this.eventImagesRepository.createMany({
        eventId: event.id,
        guestId: guest.id,
        images: uploaded.map((image) => ({
          url: image.url,
          publicId: image.publicId,
          originalName: image.originalName,
        })),
      });

      return uploaded.map((image, index) => ({
        ...image,
        id: persisted[index].id,
        position: persisted[index].position,
      }));
    } catch (error) {
      await this.cleanupImages(uploaded);
      throw error;
    }
  }

  async deleteEventImage(
    imageId: number,
    creator: CreatorSession,
  ): Promise<void> {
    const image = await this.requireOwnedEventImage(imageId, creator);
    await this.eventImagesRepository.deleteById(image.id);
    try {
      await this.cloudinaryService.deleteImage(
        image.publicId,
        this.getResourceType(image.url),
      );
    } catch {
      this.logger.warn(
        `Database image ${image.id} was deleted, but Cloudinary cleanup must be retried for ${image.publicId}.`,
      );
    }
  }

  async getGuestGallery(
    publicId: string,
    guestToken: string | undefined,
  ): Promise<GuestGalleryImage[]> {
    const { event, guest } = await this.guestAccessService.authenticate(
      publicId,
      guestToken,
    );
    return this.eventImagesRepository.findAllByEventId(event.id, guest.id);
  }

  async toggleImageLike(
    publicId: string,
    imageId: number,
    guestToken: string | undefined,
  ): Promise<{ liked: boolean; likeCount: number }> {
    const { event, guest } = await this.guestAccessService.authenticate(
      publicId,
      guestToken,
    );
    const result = await this.eventImagesRepository.toggleLike({
      imageId,
      eventId: event.id,
      guestId: guest.id,
    });
    if (!result) throw new NotFoundException('Снимката не е намерена.');
    return result;
  }

  async getGuestImageDownloadUrl(
    publicId: string,
    imageId: number,
    guestToken: string | undefined,
  ): Promise<string> {
    const { event } = await this.guestAccessService.authenticate(
      publicId,
      guestToken,
    );
    const image = await this.eventImagesRepository.findByIdForEvent(
      imageId,
      event.id,
    );
    if (!image) throw new NotFoundException('Снимката не е намерена.');
    return this.cloudinaryService.getDownloadUrl(image.url);
  }

  async getEventImageDownloadUrl(
    imageId: number,
    creator: CreatorSession,
  ): Promise<string> {
    const image = await this.requireOwnedEventImage(imageId, creator);
    return this.cloudinaryService.getDownloadUrl(image.url);
  }

  private async cleanupImages(images: UploadedImage[]): Promise<void> {
    await Promise.allSettled(
      images.map((image) =>
        this.cloudinaryService.deleteImage(image.publicId, image.resourceType),
      ),
    );
  }

  private async requireEventImage(imageId: number) {
    const image = await this.eventImagesRepository.findById(imageId);
    if (!image) {
      throw new NotFoundException('Снимката от събитието не е намерена.');
    }

    return image;
  }

  private getResourceType(url: string): 'image' | 'video' {
    return url.includes('/video/upload/') ? 'video' : 'image';
  }

  private async requireOwnedEventImage(
    imageId: number,
    creator: CreatorSession,
  ) {
    const image = await this.requireEventImage(imageId);
    if (creator.role !== 'ADMIN' && image.creatorId !== creator.id) {
      throw new ForbiddenException('Нямате достъп до тази снимка.');
    }
    return image;
  }
}

function hasAllowedFileSignature(file: Express.Multer.File): boolean {
  const bytes = file.buffer;
  if (bytes.length < 12) return false;
  const hex = bytes.subarray(0, 12).toString('hex');
  const ascii = bytes.subarray(4, 12).toString('ascii');

  if (file.mimetype.startsWith('image/')) {
    return (
      hex.startsWith('ffd8ff') ||
      hex.startsWith('89504e470d0a1a0a') ||
      hex.startsWith('474946383761') ||
      hex.startsWith('474946383961') ||
      (hex.startsWith('52494646') && ascii.endsWith('WEBP')) ||
      ascii.startsWith('ftypavif') ||
      ascii.startsWith('ftypheic') ||
      ascii.startsWith('ftypheif') ||
      ascii.startsWith('ftypmif1')
    );
  }

  if (file.mimetype.startsWith('video/')) {
    return (
      ascii.startsWith('ftyp') ||
      hex.startsWith('1a45dfa3') ||
      hex.startsWith('000001ba') ||
      hex.startsWith('000001b3')
    );
  }

  return false;
}
