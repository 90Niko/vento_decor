import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CreatorAuthGuard } from '../../auth/creator-auth.guard';
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
import { RegisterGuestDto } from './dto/register-guest.dto';
import { RequestGuestOtpDto } from './dto/request-guest-otp.dto';
import { VerifyGuestOtpDto } from './dto/verify-guest-otp.dto';

@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly guestAccessService: GuestAccessService,
  ) {}

  @Post()
  @UseGuards(CreatorAuthGuard)
  create(@Body() dto: CreateEventDto): Promise<CreatedEvent> {
    return this.eventsService.create(dto);
  }

  @Get('admin')
  @UseGuards(CreatorAuthGuard)
  findAllForAdmin(): Promise<AdminEventRecord[]> {
    return this.eventsService.findAllForAdmin();
  }

  @Delete('admin/:publicId')
  @UseGuards(CreatorAuthGuard)
  async delete(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
  ): Promise<{ deleted: true }> {
    await this.eventsService.delete(publicId);
    return { deleted: true };
  }

  @Put('admin/:publicId')
  @UseGuards(CreatorAuthGuard)
  update(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Body() dto: CreateEventDto,
  ) {
    return this.eventsService.update(publicId, dto);
  }

  @Get('admin/:publicId')
  @UseGuards(CreatorAuthGuard)
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
    return this.guestAccessService.register(publicId, dto.name, dto.email);
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
