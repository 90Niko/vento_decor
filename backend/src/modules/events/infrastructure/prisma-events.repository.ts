import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  AdminEventDetailsRecord,
  AdminEventRecord,
  CreateEventRecord,
  EventRecord,
  EventsRepository,
  GuestRecord,
} from '../domain/repositories/events.repository';

@Injectable()
export class PrismaEventsRepository implements EventsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateEventRecord): Promise<EventRecord> {
    const event = await this.prisma.events.create({
      data: {
        title: data.title,
        description: data.description,
        start_at: data.startAt,
        end_at: data.endAt,
        location: data.location,
      },
    });

    return this.toEventRecord(event);
  }

  async findAllForAdmin(): Promise<AdminEventRecord[]> {
    const events = await this.prisma.events.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { event_guests: true, event_images: true } },
      },
    });

    return events.map((event) => ({
      ...this.toEventRecord(event),
      guestCount: event._count.event_guests,
      imageCount: event._count.event_images,
    }));
  }

  async findByPublicIdForAdmin(
    publicId: string,
  ): Promise<AdminEventDetailsRecord | null> {
    const event = await this.prisma.events.findUnique({
      where: { public_id: publicId },
      include: {
        _count: { select: { event_guests: true, event_images: true } },
        event_images: {
          orderBy: [{ position: 'asc' }, { created_at: 'desc' }],
          include: { event_guests: { select: { name: true } } },
        },
      },
    });

    if (!event) {
      return null;
    }

    return {
      ...this.toEventRecord(event),
      guestCount: event._count.event_guests,
      imageCount: event._count.event_images,
      images: event.event_images.map((image) => ({
        id: image.id,
        url: image.url,
        publicId: image.public_id,
        originalName: image.alt_text,
        position: image.position,
        guestName: image.event_guests?.name ?? null,
        createdAt: image.created_at,
      })),
    };
  }

  async findActiveByPublicId(publicId: string): Promise<EventRecord | null> {
    const event = await this.prisma.events.findFirst({
      where: { public_id: publicId, is_active: true },
    });

    return event ? this.toEventRecord(event) : null;
  }

  async createGuest(data: {
    eventId: number;
    name: string;
    sessionTokenHash: string;
  }): Promise<GuestRecord> {
    const guest = await this.prisma.event_guests.create({
      data: {
        event_id: data.eventId,
        name: data.name,
        session_token_hash: data.sessionTokenHash,
      },
    });

    return {
      id: guest.id,
      eventId: guest.event_id,
      name: guest.name,
      sessionTokenHash: guest.session_token_hash,
      createdAt: guest.created_at,
    };
  }

  async findGuestBySession(data: {
    eventId: number;
    sessionTokenHash: string;
  }): Promise<GuestRecord | null> {
    const guest = await this.prisma.event_guests.findFirst({
      where: {
        event_id: data.eventId,
        session_token_hash: data.sessionTokenHash,
      },
    });

    return guest
      ? {
          id: guest.id,
          eventId: guest.event_id,
          name: guest.name,
          sessionTokenHash: guest.session_token_hash,
          createdAt: guest.created_at,
        }
      : null;
  }

  private toEventRecord(event: {
    id: number;
    public_id: string;
    title: string;
    description: string | null;
    start_at: Date | null;
    end_at: Date | null;
    location: string | null;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }): EventRecord {
    return {
      id: event.id,
      publicId: event.public_id,
      title: event.title,
      description: event.description,
      startAt: event.start_at,
      endAt: event.end_at,
      location: event.location,
      isActive: event.is_active,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    };
  }
}
