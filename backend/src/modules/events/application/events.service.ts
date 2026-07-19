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

  async create(dto: CreateEventDto): Promise<CreatedEvent> {
    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;

    if (startAt && endAt && endAt < startAt) {
      throw new BadRequestException(
        'Крайната дата трябва да бъде след началната дата.',
      );
    }

    const event = await this.eventsRepository.create({
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

  async update(publicId: string, dto: CreateEventDto): Promise<EventRecord> {
    const startAt = dto.startAt ? new Date(dto.startAt) : null;
    const endAt = dto.endAt ? new Date(dto.endAt) : null;
    if (startAt && endAt && endAt < startAt) {
      throw new BadRequestException(
        'Крайната дата трябва да бъде след началната дата.',
      );
    }
    const existing = await this.eventsRepository.findByPublicIdForAdmin(publicId);
    if (!existing) throw new NotFoundException('Събитието не е намерено.');
    const updated = await this.eventsRepository.updateByPublicId(publicId, {
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      startAt,
      endAt,
      location: dto.location.trim(),
      eventType: dto.eventType ?? 'other',
      uploadDeadline: dto.uploadDeadline ? new Date(dto.uploadDeadline) : null,
      coverImageUrl: dto.coverImageUrl?.trim() || existing.coverImageUrl,
      coverImagePublicId:
        dto.coverImagePublicId?.trim() || existing.coverImagePublicId,
      themeColor: dto.themeColor ?? 'ocean',
    });
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

  findAllForAdmin(): Promise<AdminEventRecord[]> {
    return this.eventsRepository.findAllForAdmin();
  }

  async delete(publicId: string): Promise<void> {
    const deleted = await this.eventsRepository.deleteByPublicId(publicId);
    if (!deleted) {
      throw new NotFoundException('Събитието не е намерено.');
    }
  }

  async findForAdmin(publicId: string): Promise<AdminEventDetailsRecord> {
    const event = await this.eventsRepository.findByPublicIdForAdmin(publicId);
    if (!event) {
      throw new NotFoundException('Събитието не е намерено.');
    }

    return event;
  }
}
