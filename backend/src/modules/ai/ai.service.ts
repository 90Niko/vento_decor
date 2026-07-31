import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenerateEventCopyDto } from './dto/generate-event-copy.dto';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async generateEventCopy(
    input: GenerateEventCopyDto,
  ): Promise<{ description: string }> {
    const groqApiKey = cleanSecret(
      this.config.get<string>('GROQ_API_KEY'),
    );
    const apiKey =
      groqApiKey ?? cleanSecret(this.config.get<string>('AI_API_KEY'));
    const usesGroq = Boolean(groqApiKey || apiKey?.startsWith('gsk_'));
    const baseUrl = (
      this.config.get<string>('AI_BASE_URL') ??
      (usesGroq
        ? 'https://api.groq.com/openai/v1'
        : 'http://127.0.0.1:11434/v1')
    ).replace(/\/+$/, '');
    const model =
      this.config.get<string>('AI_MODEL')?.trim() ??
      (usesGroq ? 'openai/gpt-oss-20b' : 'gpt-oss:20b');

    if (!apiKey && this.config.get('NODE_ENV') === 'production') {
      throw new ServiceUnavailableException(
        'AI generation is not configured.',
      );
    }

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 350,
          messages: [
            {
              role: 'system',
              content:
                'Write warm, natural event copy in Bulgarian. Return only the final guest-facing message, without a title, markdown, quotes, or commentary. Use 2-3 short sentences and never invent names, dates, or details.',
            },
            {
              role: 'user',
              content: [
                `Event title: ${input.title}`,
                `Event type: ${input.eventType}`,
                input.location ? `Location: ${input.location}` : null,
                'Write an inviting message asking guests to share their favorite photos from the event.',
              ]
                .filter(Boolean)
                .join('\n'),
            },
          ],
        }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch {
      throw new ServiceUnavailableException(
        'The AI service is temporarily unavailable.',
      );
    }

    const payload = (await response
      .json()
      .catch(() => ({}))) as ChatCompletionResponse;
    if (!response.ok) {
      throw new BadGatewayException(
        payload.error?.message ?? 'The AI provider rejected the request.',
      );
    }

    const description = payload.choices?.[0]?.message?.content?.trim();
    if (!description) {
      throw new BadGatewayException(
        'The AI provider returned an empty response.',
      );
    }
    return { description };
  }
}

function cleanSecret(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (
    trimmed.length >= 2 &&
    ((trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'")))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }
  return trimmed;
}
