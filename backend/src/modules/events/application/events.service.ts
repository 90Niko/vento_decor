import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AdminEventDetailsRecord,
  AdminEventRecord,
  EventRecord,
  EventsRepository,
} from '../domain/repositories/events.repository';
import { CreateEventDto } from '../presentation/dto/create-event.dto';
import { CreatorSession } from '../../auth/auth.service';

export interface CreatedEvent extends EventRecord {
  publicUrl: string;
}

export type PublicEvent = Pick<
  EventRecord,
  | 'publicId'
  | 'title'
  | 'description'
  | 'startAt'
  | 'endAt'
  | 'location'
  | 'eventType'
  | 'uploadDeadline'
  | 'coverImageUrl'
  | 'themeColor'
>;

@Injectable()
export class EventsService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(
    dto: CreateEventDto,
    creator: CreatorSession,
  ): Promise<CreatedEvent> {
    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;

    if (startAt && endAt && endAt < startAt) {
      throw new BadRequestException(
        'Крайната дата трябва да бъде след началната дата.',
      );
    }

    const event = await this.eventsRepository.create({
      creatorId: creator.id,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      startAt,
      endAt,
      location: dto.location?.trim() || null,
      eventType: dto.eventType ?? 'other',
      uploadDeadline: dto.uploadDeadline ? new Date(dto.uploadDeadline) : null,
      coverImageUrl: dto.coverImageUrl?.trim() || null,
      coverImagePublicId: dto.coverImagePublicId?.trim() || null,
      themeColor: dto.themeColor ?? 'ocean',
    });
    const publicAppUrl = this.configService
      .get<string>('PUBLIC_APP_URL', 'http://localhost:3002')
      .replace(/\/+$/, '');

    return {
      ...event,
      publicUrl: `${publicAppUrl}/event/${event.publicId}`,
    };
  }

  async update(
    publicId: string,
    dto: CreateEventDto,
    creator: CreatorSession,
  ): Promise<EventRecord> {
    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (startAt && endAt && endAt < startAt) {
      throw new BadRequestException(
        'Крайната дата трябва да бъде след началната дата.',
      );
    }
    const ownerId = creator.role === 'ADMIN' ? undefined : creator.id;
    const existing = await this.eventsRepository.findByPublicIdForAdmin(
      publicId,
      ownerId,
    );
    if (!existing) throw new NotFoundException('Събитието не е намерено.');
    const updated = await this.eventsRepository.updateByPublicId(
      publicId,
      {
        creatorId: existing.creatorId,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        startAt,
        endAt,
        location: dto.location.trim(),
        eventType: dto.eventType ?? 'other',
        uploadDeadline: dto.uploadDeadline
          ? new Date(dto.uploadDeadline)
          : null,
        coverImageUrl: dto.coverImageUrl?.trim() || existing.coverImageUrl,
        coverImagePublicId:
          dto.coverImagePublicId?.trim() || existing.coverImagePublicId,
        themeColor: dto.themeColor ?? 'ocean',
      },
      ownerId,
    );
    if (!updated) throw new NotFoundException('Събитието не е намерено.');
    return updated;
  }

  async findPublic(publicId: string): Promise<PublicEvent> {
    const event = await this.eventsRepository.findActiveByPublicId(publicId);
    if (!event) {
      throw new NotFoundException('Събитието не е намерено или не е активно.');
    }

    return {
      publicId: event.publicId,
      title: event.title,
      description: event.description,
      startAt: event.startAt,
      endAt: event.endAt,
      location: event.location,
      eventType: event.eventType,
      uploadDeadline: event.uploadDeadline,
      coverImageUrl: event.coverImageUrl,
      themeColor: event.themeColor,
    };
  }

  findAllForAdmin(creator: CreatorSession): Promise<AdminEventRecord[]> {
    return this.eventsRepository.findAllForAdmin(
      creator.role === 'ADMIN' ? undefined : creator.id,
    );
  }

  async delete(publicId: string, creator: CreatorSession): Promise<void> {
    const deleted = await this.eventsRepository.deleteByPublicId(
      publicId,
      creator.role === 'ADMIN' ? undefined : creator.id,
    );
    if (!deleted) {
      throw new NotFoundException('Събитието не е намерено.');
    }
  }

  async findForAdmin(
    publicId: string,
    creator: CreatorSession,
  ): Promise<AdminEventDetailsRecord> {
    const event = await this.eventsRepository.findByPublicIdForAdmin(
      publicId,
      creator.role === 'ADMIN' ? undefined : creator.id,
    );
    if (!event) {
      throw new NotFoundException('Събитието не е намерено.');
    }

    return event;
  }
}
