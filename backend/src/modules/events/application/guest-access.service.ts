import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import {
  EventRecord,
  EventsRepository,
  GuestRecord,
} from '../domain/repositories/events.repository';

export interface RegisteredGuest {
  guest: {
    id: number;
    name: string;
  };
  token: string;
}

export interface AuthenticatedGuest {
  event: EventRecord;
  guest: GuestRecord;
}

@Injectable()
export class GuestAccessService {
  constructor(private readonly eventsRepository: EventsRepository) {}

  async register(publicId: string, name: string): Promise<RegisteredGuest> {
    const event = await this.requireActiveEvent(publicId);
    const token = randomBytes(32).toString('hex');
    const guest = await this.eventsRepository.createGuest({
      eventId: event.id,
      name: name.trim(),
      sessionTokenHash: this.hashToken(token),
    });

    return {
      guest: { id: guest.id, name: guest.name },
      token,
    };
  }

  async authenticate(
    publicId: string,
    token: string | undefined,
  ): Promise<AuthenticatedGuest> {
    if (!token) {
      throw new UnauthorizedException(
        'Необходим е достъп на регистриран гост.',
      );
    }

    const event = await this.requireActiveEvent(publicId);
    const guest = await this.eventsRepository.findGuestBySession({
      eventId: event.id,
      sessionTokenHash: this.hashToken(token),
    });

    if (!guest) {
      throw new UnauthorizedException('Сесията на госта е невалидна.');
    }

    return { event, guest };
  }

  private async requireActiveEvent(publicId: string): Promise<EventRecord> {
    const event = await this.eventsRepository.findActiveByPublicId(publicId);
    if (!event) {
      throw new NotFoundException('Събитието не е намерено или не е активно.');
    }

    return event;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
