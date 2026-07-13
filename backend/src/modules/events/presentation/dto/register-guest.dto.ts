import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class RegisterGuestDto {
  @IsString({ message: 'Името трябва да бъде текст.' })
  @IsNotEmpty({ message: 'Името е задължително.' })
  @Matches(/\S/, { message: 'Името трябва да съдържа видими символи.' })
  @MaxLength(100, { message: 'Името може да бъде до 100 символа.' })
  name!: string;
}
