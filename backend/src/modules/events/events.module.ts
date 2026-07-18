import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../infrastructure/database/database.module';
import { EventsService } from './application/events.service';
import { GuestAccessService } from './application/guest-access.service';
import { EventsRepository } from './domain/repositories/events.repository';
import { PrismaEventsRepository } from './infrastructure/prisma-events.repository';
import { ResendGuestOtpEmailService } from './infrastructure/resend-guest-otp-email.service';
import { EventsController } from './presentation/events.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [EventsController],
  providers: [
    EventsService,
    GuestAccessService,
    ResendGuestOtpEmailService,
    {
      provide: EventsRepository,
      useClass: PrismaEventsRepository,
    },
  ],
  exports: [EventsService, GuestAccessService],
})
export class EventsModule {}
