import { IsEmail, Matches, MaxLength } from 'class-validator';

export class VerifyGuestOtpDto {
  @IsEmail()
  @MaxLength(255)
  email!: string;

  @Matches(/^\d{6}$/)
  code!: string;
}
