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
  'publicId' | 'title' | 'description' | 'startAt' | 'endAt' | 'location'
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
    });
    const publicAppUrl = this.configService
      .get<string>('PUBLIC_APP_URL', 'http://localhost:3002')
      .replace(/\/+$/, '');

    return {
      ...event,
      publicUrl: `${publicAppUrl}/event/${event.publicId}`,
    };
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
    };
  }

  findAllForAdmin(): Promise<AdminEventRecord[]> {
    return this.eventsRepository.findAllForAdmin();
  }

  async findForAdmin(publicId: string): Promise<AdminEventDetailsRecord> {
    const event = await this.eventsRepository.findByPublicIdForAdmin(publicId);
    if (!event) {
      throw new NotFoundException('Събитието не е намерено.');
    }

    return event;
  }
}
