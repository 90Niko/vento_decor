import {
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
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

export interface UploadedEventImage extends UploadedImage {
  id: number;
  position: number;
}

@Injectable()
export class UploadsService {
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

  async deleteEventImage(imageId: number): Promise<void> {
    const image = await this.requireEventImage(imageId);
    await this.cloudinaryService.deleteImage(image.publicId);
    await this.eventImagesRepository.deleteById(image.id);
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

  async getEventImageDownloadUrl(imageId: number): Promise<string> {
    const image = await this.requireEventImage(imageId);
    return this.cloudinaryService.getDownloadUrl(image.url);
  }

  private async cleanupImages(images: UploadedImage[]): Promise<void> {
    await Promise.allSettled(
      images.map((image) => this.cloudinaryService.deleteImage(image.publicId)),
    );
  }

  private async requireEventImage(imageId: number) {
    const image = await this.eventImagesRepository.findById(imageId);
    if (!image) {
      throw new NotFoundException('Снимката от събитието не е намерена.');
    }

    return image;
  }
}
