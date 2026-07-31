import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CreatorAuthGuard } from '../auth/creator-auth.guard';
import { AiService } from './ai.service';
import { GenerateEventCopyDto } from './dto/generate-event-copy.dto';

@Controller('ai')
@UseGuards(CreatorAuthGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('event-copy')
  generateEventCopy(
    @Body() dto: GenerateEventCopyDto,
  ): Promise<{ description: string }> {
    return this.aiService.generateEventCopy(dto);
  }
}
