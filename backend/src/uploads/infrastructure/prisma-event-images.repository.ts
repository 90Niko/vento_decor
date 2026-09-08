import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma/prisma.service';
import {
  EventImagesRepository,
  GuestGalleryImage,
  PersistedEventImage,
  StoredEventImage,
} from '../domain/event-images.repository';

@Injectable()
export class PrismaEventImagesRepository implements EventImagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(data: {
    eventId: number;
    guestId: number;
    images: Array<{
      url: string;
      publicId: string;
      originalName: string;
    }>;
  }): Promise<PersistedEventImage[]> {
    const aggregate = await this.prisma.event_images.aggregate({
      where: { event_id: data.eventId },
      _max: { position: true },
    });
    const startPosition = (aggregate._max.position ?? -1) + 1;
    const records = await this.prisma.$transaction(
      data.images.map((image, index) =>
        this.prisma.event_images.create({
          data: {
            event_id: data.eventId,
            guest_id: data.guestId,
            url: image.url,
            public_id: image.publicId,
            alt_text: image.originalName,
            position: startPosition + index,
          },
        }),
      ),
    );

    return records.map((record, index) => ({
      id: record.id,
      url: record.url,
      publicId: record.public_id,
      originalName: data.images[index].originalName,
      position: record.position,
    }));
  }

  async findById(id: number): Promise<StoredEventImage | null> {
    const image = await this.prisma.event_images.findUnique({
      where: { id },
      select: {
        id: true,
        url: true,
        public_id: true,
        events: { select: { creator_id: true } },
      },
    });

    return image
      ? {
          id: image.id,
          url: image.url,
          publicId: image.public_id,
          creatorId: image.events.creator_id,
        }
      : null;
  }

  async findByIdForEvent(
    id: number,
    eventId: number,
  ): Promise<StoredEventImage | null> {
    const image = await this.prisma.event_images.findFirst({
      where: { id, event_id: eventId },
      select: {
        id: true,
        url: true,
        public_id: true,
        events: { select: { creator_id: true } },
      },
    });
    return image
      ? {
          id: image.id,
          url: image.url,
          publicId: image.public_id,
          creatorId: image.events.creator_id,
        }
      : null;
  }

  async findAllByEventId(
    eventId: number,
    guestId: number,
    page?: { beforeId?: number; take: number },
  ): Promise<GuestGalleryImage[]> {
    const images = await this.prisma.event_images.findMany({
      where: {
        event_id: eventId,
        ...(page?.beforeId ? { id: { lt: page.beforeId } } : {}),
      },
      orderBy: page ? { id: 'desc' } : { created_at: 'desc' },
      take: page?.take ?? 500,
      include: {
        event_guests: { select: { name: true } },
        _count: { select: { event_image_likes: true } },
        event_image_likes: {
          where: { guest_id: guestId },
          select: { id: true },
        },
      },
    });

    return images.map((image) => ({
      id: image.id,
      url: image.url,
      publicId: image.public_id,
      originalName: image.alt_text,
      guestName: image.event_guests?.name ?? null,
      createdAt: image.created_at,
      likeCount: image._count.event_image_likes,
      likedByGuest: image.event_image_likes.length > 0,
    }));
  }

  async toggleLike(data: {
    imageId: number;
    eventId: number;
    guestId: number;
  }): Promise<{ liked: boolean; likeCount: number } | null> {
    const image = await this.prisma.event_images.findFirst({
      where: { id: data.imageId, event_id: data.eventId },
      select: { id: true },
    });
    if (!image) return null;

    const existing = await this.prisma.event_image_likes.findUnique({
      where: {
        image_id_guest_id: {
          image_id: data.imageId,
          guest_id: data.guestId,
        },
      },
    });

    if (existing) {
      await this.prisma.event_image_likes.delete({
        where: { id: existing.id },
      });
    } else {
      await this.prisma.event_image_likes.create({
        data: { image_id: data.imageId, guest_id: data.guestId },
      });
    }

    const likeCount = await this.prisma.event_image_likes.count({
      where: { image_id: data.imageId },
    });
    return { liked: !existing, likeCount };
  }

  async deleteById(id: number): Promise<void> {
    await this.prisma.event_images.delete({ where: { id } });
  }
}
