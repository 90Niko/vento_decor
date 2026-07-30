import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ResendGuestOtpEmailService {
  private readonly logger = new Logger(ResendGuestOtpEmailService.name);

  constructor(private readonly config: ConfigService) {}

  async send(input: {
    to: string;
    code: string;
    eventTitle: string;
  }): Promise<boolean> {
    const apiKey = this.config.get<string>('RESEND_API_KEY');
    const from = this.config.get<string>('RESEND_FROM_EMAIL');
    const isConfigured = Boolean(
      apiKey?.startsWith('re_') && from?.includes('@'),
    );

    if (!isConfigured && process.env.NODE_ENV !== 'production') {
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn(`Development OTP for ${input.to}: ${input.code}`);
      }
      return false;
    }
    if (!isConfigured) {
      throw new ServiceUnavailableException(
        'Входът с електронна поща не е настроен.',
      );
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `Код за достъп до ${input.eventTitle}`,
        html: `<p>Вашият еднократен код е:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${input.code}</p><p>Кодът е валиден 10 минути.</p>`,
      }),
    });

    if (!response.ok) {
      this.logger.error(
        `Resend rejected OTP email with status ${response.status}.`,
      );
      if (process.env.NODE_ENV !== 'production') {
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(`Development OTP for ${input.to}: ${input.code}`);
        }
        return false;
      }
      throw new ServiceUnavailableException(
        'Кодът за достъп не можа да бъде изпратен.',
      );
    }
    return true;
  }
}
