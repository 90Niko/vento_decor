import {
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateEventDto {
  @IsString({ message: 'Заглавието трябва да бъде текст.' })
  @IsNotEmpty({ message: 'Заглавието е задължително.' })
  @Matches(/\S/, { message: 'Заглавието трябва да съдържа видими символи.' })
  @MaxLength(150, { message: 'Заглавието може да бъде до 150 символа.' })
  title!: string;

  @IsOptional()
  @IsString({ message: 'Описанието трябва да бъде текст.' })
  @MaxLength(10000, { message: 'Описанието е твърде дълго.' })
  description?: string;

  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'Началната дата е в невалиден формат.' },
  )
  startAt?: string;

  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: 'Крайната дата е в невалиден формат.' },
  )
  endAt?: string;

  @IsOptional()
  @IsString({ message: 'Локацията трябва да бъде текст.' })
  @MaxLength(255, { message: 'Локацията може да бъде до 255 символа.' })
  location?: string;
}
