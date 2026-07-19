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
      select: { id: true, url: true, public_id: true },
    });

    return image
      ? { id: image.id, url: image.url, publicId: image.public_id }
      : null;
  }

  async findAllByEventId(eventId: number): Promise<GuestGalleryImage[]> {
    const images = await this.prisma.event_images.findMany({
      where: { event_id: eventId },
      orderBy: { created_at: 'desc' },
      include: { event_guests: { select: { name: true } } },
    });

    return images.map((image) => ({
      id: image.id,
      url: image.url,
      publicId: image.public_id,
      originalName: image.alt_text,
      guestName: image.event_guests?.name ?? null,
      createdAt: image.created_at,
    }));
  }

  async deleteById(id: number): Promise<void> {
    await this.prisma.event_images.delete({ where: { id } });
  }
}
