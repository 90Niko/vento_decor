import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import {
  CreatedEvent,
  EventsService,
  PublicEvent,
} from '../application/events.service';
import {
  GuestAccessService,
  RegisteredGuest,
} from '../application/guest-access.service';
import { CreateEventDto } from './dto/create-event.dto';
import { RegisterGuestDto } from './dto/register-guest.dto';
import {
  AdminEventDetailsRecord,
  AdminEventRecord,
} from '../domain/repositories/events.repository';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly guestAccessService: GuestAccessService,
  ) {}

  @Post()
  create(@Body() dto: CreateEventDto): Promise<CreatedEvent> {
    return this.eventsService.create(dto);
  }

  @Get('admin')
  findAllForAdmin(): Promise<AdminEventRecord[]> {
    return this.eventsService.findAllForAdmin();
  }

  @Get('admin/:publicId')
  findForAdmin(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
  ): Promise<AdminEventDetailsRecord> {
    return this.eventsService.findForAdmin(publicId);
  }

  @Get('public/:publicId')
  findPublic(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
  ): Promise<PublicEvent> {
    return this.eventsService.findPublic(publicId);
  }

  @Post('public/:publicId/guests')
  registerGuest(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Body() dto: RegisterGuestDto,
  ): Promise<RegisteredGuest> {
    return this.guestAccessService.register(publicId, dto.name);
  }
}
