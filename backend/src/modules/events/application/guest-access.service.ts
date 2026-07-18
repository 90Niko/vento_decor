import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';
import {
  EventRecord,
  EventsRepository,
  GuestRecord,
} from '../domain/repositories/events.repository';
import { ResendGuestOtpEmailService } from '../infrastructure/resend-guest-otp-email.service';

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
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly otpEmail: ResendGuestOtpEmailService,
  ) {}

  async requestOtp(publicId: string, name: string, email: string): Promise<void> {
    const event = await this.requireActiveEvent(publicId);
    const normalizedEmail = email.trim().toLowerCase();
    const code = String(Math.floor(100000 + Math.random() * 900000));
    await this.eventsRepository.createOtpChallenge({
      eventId: event.id,
      email: normalizedEmail,
      name: name.trim(),
      codeHash: this.hashToken(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });
    await this.otpEmail.send({ to: normalizedEmail, code, eventTitle: event.title });
  }

  async verifyOtp(publicId: string, email: string, code: string): Promise<RegisteredGuest> {
    const event = await this.requireActiveEvent(publicId);
    const normalizedEmail = email.trim().toLowerCase();
    const challenge = await this.eventsRepository.consumeOtpChallenge({
      eventId: event.id,
      email: normalizedEmail,
      codeHash: this.hashToken(code),
    });
    if (!challenge) {
      throw new BadRequestException('The access code is invalid or expired.');
    }

    const token = randomBytes(32).toString('hex');
    const guest = await this.eventsRepository.upsertGuest({
      eventId: event.id,
      email: normalizedEmail,
      name: challenge.name,
      sessionTokenHash: this.hashToken(token),
    });
    return { guest: { id: guest.id, name: guest.name }, token };
  }

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
