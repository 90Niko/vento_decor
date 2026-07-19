import {
  Body,
  Controller,
  Delete,
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
import {
  AdminEventDetailsRecord,
  AdminEventRecord,
} from '../domain/repositories/events.repository';
import { CreateEventDto } from './dto/create-event.dto';
import { RequestGuestOtpDto } from './dto/request-guest-otp.dto';
import { VerifyGuestOtpDto } from './dto/verify-guest-otp.dto';

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

  @Delete('admin/:publicId')
  async delete(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
  ): Promise<{ deleted: true }> {
    await this.eventsService.delete(publicId);
    return { deleted: true };
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

  @Post('public/:publicId/guest-otp')
  async requestGuestOtp(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Body() dto: RequestGuestOtpDto,
  ): Promise<{ message: string; devCode?: string }> {
    const devCode = await this.guestAccessService.requestOtp(
      publicId,
      dto.name,
      dto.email,
    );
    return {
      message: devCode
        ? 'Тестовият код е генериран.'
        : 'Кодът за достъп е изпратен.',
      ...(devCode ? { devCode } : {}),
    };
  }

  @Post('public/:publicId/guest-otp/verify')
  verifyGuestOtp(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Body() dto: VerifyGuestOtpDto,
  ): Promise<RegisteredGuest> {
    return this.guestAccessService.verifyOtp(publicId, dto.email, dto.code);
  }
}
