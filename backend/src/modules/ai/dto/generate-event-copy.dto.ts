import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const EVENT_TYPES = [
  'wedding',
  'birthday',
  'baptism',
  'prom',
  'corporate',
  'other',
];

export class GenerateEventCopyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsIn(EVENT_TYPES)
  eventType!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;
}
