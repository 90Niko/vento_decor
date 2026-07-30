import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Put,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CreatorSession } from '../../auth/auth.service';
import { CreatorAuthGuard } from '../../auth/creator-auth.guard';
import { EventQuizService } from '../application/event-quiz.service';
import { SubmitQuizAttemptDto } from './dto/submit-quiz-attempt.dto';
import { UpdateEventQuizDto } from './dto/update-event-quiz.dto';

@Controller('events')
export class EventQuizController {
  constructor(private readonly quizService: EventQuizService) {}

  @Get('admin/:publicId/quiz')
  @UseGuards(CreatorAuthGuard)
  getForManager(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Req() request: Request & { creator: CreatorSession },
  ): Promise<unknown> {
    return this.quizService.getForManager(publicId, request.creator);
  }

  @Put('admin/:publicId/quiz')
  @UseGuards(CreatorAuthGuard)
  update(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Req() request: Request & { creator: CreatorSession },
    @Body() dto: UpdateEventQuizDto,
  ): Promise<unknown> {
    return this.quizService.update(publicId, request.creator, dto);
  }

  @Get('public/:publicId/quiz')
  getPublic(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Headers('authorization') authorization: string | undefined,
  ): Promise<unknown> {
    return this.quizService.getPublic(publicId, bearerToken(authorization));
  }

  @Post('public/:publicId/quiz/attempts')
  submit(
    @Param('publicId', new ParseUUIDPipe({ version: '4' })) publicId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() dto: SubmitQuizAttemptDto,
  ): Promise<unknown> {
    return this.quizService.submit(
      publicId,
      bearerToken(authorization),
      dto.answers,
    );
  }
}

function bearerToken(authorization: string | undefined) {
  return authorization?.startsWith('Bearer ')
    ? authorization.slice(7).trim() || undefined
    : undefined;
}
