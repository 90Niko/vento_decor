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
        creator_id: data.creatorId,
        title: data.title,
        description: data.description,
        start_at: data.startAt,
        end_at: data.endAt,
        location: data.location,
        event_type: data.eventType,
        upload_deadline: data.uploadDeadline,
        cover_image_url: data.coverImageUrl,
        cover_image_public_id: data.coverImagePublicId,
        theme_color: data.themeColor,
        require_guest_otp: data.requireGuestOtp,
      },
    });

    return this.toEventRecord(event);
  }

  async updateByPublicId(
    publicId: string,
    data: CreateEventRecord,
    ownerId?: number,
  ): Promise<EventRecord | null> {
    const result = await this.prisma.events.updateMany({
      where: {
        public_id: publicId,
        ...(ownerId ? { creator_id: ownerId } : {}),
      },
      data: {
        title: data.title,
        description: data.description,
        start_at: data.startAt,
        end_at: data.endAt,
        location: data.location,
        event_type: data.eventType,
        upload_deadline: data.uploadDeadline,
        cover_image_url: data.coverImageUrl,
        cover_image_public_id: data.coverImagePublicId,
        theme_color: data.themeColor,
        require_guest_otp: data.requireGuestOtp,
      },
    });
    if (result.count !== 1) return null;
    const event = await this.prisma.events.findUnique({
      where: {
        public_id: publicId,
        ...(ownerId ? { creator_id: ownerId } : {}),
      },
    });
    return event ? this.toEventRecord(event) : null;
  }

  async deleteByPublicId(publicId: string, ownerId?: number): Promise<boolean> {
    const result = await this.prisma.events.deleteMany({
      where: {
        public_id: publicId,
        ...(ownerId ? { creator_id: ownerId } : {}),
      },
    });

    return result.count === 1;
  }

  async findAllForAdmin(ownerId?: number): Promise<AdminEventRecord[]> {
    const events = await this.prisma.events.findMany({
      where: ownerId ? { creator_id: ownerId } : undefined,
      orderBy: { created_at: 'desc' },
      take: 200,
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
    ownerId?: number,
  ): Promise<AdminEventDetailsRecord | null> {
    const event = await this.prisma.events.findFirst({
      where: {
        public_id: publicId,
        ...(ownerId ? { creator_id: ownerId } : {}),
      },
      include: {
        _count: { select: { event_guests: true, event_images: true } },
        event_images: {
          orderBy: [{ position: 'asc' }, { created_at: 'desc' }],
          take: 500,
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

  async upsertGuest(data: {
    eventId: number;
    email: string;
    name: string;
    sessionTokenHash: string;
    sessionExpiresAt: Date;
  }): Promise<GuestRecord> {
    const guest = await this.prisma.event_guests.upsert({
      where: { event_id_email: { event_id: data.eventId, email: data.email } },
      create: {
        event_id: data.eventId,
        email: data.email,
        name: data.name,
        session_token_hash: data.sessionTokenHash,
        session_expires_at: data.sessionExpiresAt,
      },
      update: {
        name: data.name,
        session_token_hash: data.sessionTokenHash,
        session_expires_at: data.sessionExpiresAt,
      },
    });

    return {
      id: guest.id,
      eventId: guest.event_id,
      name: guest.name,
      email: guest.email,
      sessionTokenHash: guest.session_token_hash,
      createdAt: guest.created_at,
      sessionExpiresAt: guest.session_expires_at,
    };
  }

  async createOtpChallenge(data: {
    eventId: number;
    email: string;
    name: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<void> {
    await this.prisma.guest_otp_challenges.create({
      data: {
        event_id: data.eventId,
        email: data.email,
        name: data.name,
        code_hash: data.codeHash,
        expires_at: data.expiresAt,
      },
    });
  }

  async consumeOtpChallenge(data: {
    eventId: number;
    email: string;
    codeHash: string;
  }): Promise<{ name: string; matched: boolean } | null> {
    const challenge = await this.prisma.guest_otp_challenges.findFirst({
      where: {
        event_id: data.eventId,
        email: data.email,
        consumed_at: null,
        expires_at: { gt: new Date() },
        attempts: { lt: 5 },
      },
      orderBy: { created_at: 'desc' },
    });
    if (!challenge) return null;

    const matched = challenge.code_hash === data.codeHash;
    const result = await this.prisma.guest_otp_challenges.updateMany({
      where: {
        id: challenge.id,
        consumed_at: null,
        attempts: challenge.attempts,
      },
      data: matched
        ? { consumed_at: new Date() }
        : { attempts: { increment: 1 } },
    });
    return result.count === 1 ? { name: challenge.name, matched } : null;
  }

  async findGuestBySession(data: {
    eventId: number;
    sessionTokenHash: string;
  }): Promise<GuestRecord | null> {
    const guest = await this.prisma.event_guests.findFirst({
      where: {
        event_id: data.eventId,
        session_token_hash: data.sessionTokenHash,
        session_expires_at: { gt: new Date() },
      },
    });

    return guest
      ? {
          id: guest.id,
          eventId: guest.event_id,
          name: guest.name,
          email: guest.email,
          sessionTokenHash: guest.session_token_hash,
          createdAt: guest.created_at,
          sessionExpiresAt: guest.session_expires_at,
        }
      : null;
  }

  private toEventRecord(event: {
    id: number;
    creator_id: number | null;
    public_id: string;
    title: string;
    description: string | null;
    start_at: Date | null;
    end_at: Date | null;
    location: string | null;
    event_type: string;
    upload_deadline: Date | null;
    cover_image_url: string | null;
    cover_image_public_id: string | null;
    theme_color: string;
    require_guest_otp: boolean;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
  }): EventRecord {
    return {
      id: event.id,
      creatorId: event.creator_id ?? 0,
      publicId: event.public_id,
      title: event.title,
      description: event.description,
      startAt: event.start_at,
      endAt: event.end_at,
      location: event.location,
      eventType: event.event_type,
      uploadDeadline: event.upload_deadline,
      coverImageUrl: event.cover_image_url,
      coverImagePublicId: event.cover_image_public_id,
      themeColor: event.theme_color,
      requireGuestOtp: event.require_guest_otp,
      isActive: event.is_active,
      createdAt: event.created_at,
      updatedAt: event.updated_at,
    };
  }
}
