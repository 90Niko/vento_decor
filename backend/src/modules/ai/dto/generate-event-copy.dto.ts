import {
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class GenerateEventCopyDto {
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  title!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(40)
  eventType!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsISO8601()
  @IsOptional()
  startAt?: string;

  @IsString()
  @IsIn(['warm', 'playful', 'formal'])
  tone!: 'warm' | 'playful' | 'formal';

  @IsString()
  @IsOptional()
  @MaxLength(500)
  keywords?: string;

  @IsString()
  @IsOptional()
  @MaxLength(10000)
  sourceText?: string;
}
