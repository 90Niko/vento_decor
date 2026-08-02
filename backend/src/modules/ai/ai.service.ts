import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatDto } from './dto/chat.dto';
import { GenerateEventCopyDto } from './dto/generate-event-copy.dto';

interface ChatCompletionResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

@Injectable()
export class AiService {
  constructor(private readonly config: ConfigService) {}

  async chat(input: ChatDto): Promise<{ message: string }> {
    const message = await this.complete([
      {
        role: 'system',
        content:
          'You are the Vento Decor AI assistant. Reply in Bulgarian unless the user asks for another language. Help with event planning, invitations, decoration, guest communication, schedules, and creative ideas. Be practical, warm, and concise. Do not claim to have performed actions you cannot perform.',
      },
      ...input.messages.map((item) => ({
        role: item.role,
        content: item.content.trim(),
      })),
    ]);
    return { message };
  }

  async generateEventCopy(
    input: GenerateEventCopyDto,
  ): Promise<{ description: string }> {
    const toneInstructions = {
      warm: 'Use a warm, heartfelt and welcoming tone.',
      playful: 'Use a playful, cheerful and relaxed tone.',
      formal: 'Use an elegant, polished and formal tone.',
    } as const;
    const description = await this.complete(
      [
        {
          role: 'system',
          content:
            'Write warm, natural event copy in Bulgarian for an upcoming event. Address the guests directly and write only in present or future tense, as an invitation before the event takes place. Never use past tense or imply that the event has already happened. Return only the final guest-facing message, without a title, markdown, quotes, or commentary. Use 2-3 short sentences and never invent names, dates, or details.',
        },
        {
          role: 'user',
          content: [
            `Event title: ${input.title}`,
            `Event type: ${input.eventType}`,
            input.location ? `Location: ${input.location}` : null,
            input.startAt ? `Date and time: ${input.startAt}` : null,
            toneInstructions[input.tone],
            'Write an inviting message asking guests to capture and share their favorite photos during the upcoming event. Make it clear that the event is yet to take place.',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ],
      350,
    );
    return { description };
  }

  private async complete(
    messages: Array<{ role: string; content: string }>,
    maxTokens = 800,
  ): Promise<string> {
    const xaiApiKey = cleanSecret(this.config.get<string>('XAI_API_KEY'));
    const groqApiKey = cleanSecret(this.config.get<string>('GROQ_API_KEY'));
    const apiKey =
      xaiApiKey ??
      groqApiKey ??
      cleanSecret(this.config.get<string>('AI_API_KEY'));
    const usesXai = Boolean(xaiApiKey || apiKey?.startsWith('xai-'));
    const usesGroq = Boolean(groqApiKey || apiKey?.startsWith('gsk_'));
    const baseUrl = (
      this.config.get<string>('AI_BASE_URL') ??
      (usesXai
        ? 'https://api.x.ai/v1'
        : usesGroq
          ? 'https://api.groq.com/openai/v1'
          : 'http://127.0.0.1:11434/v1')
    ).replace(/\/+$/, '');
    const model =
      this.config.get<string>('AI_MODEL')?.trim() ??
      (usesXai ? 'grok-4.5' : usesGroq ? 'openai/gpt-oss-20b' : 'gpt-oss:20b');

    if (!apiKey && this.config.get('NODE_ENV') === 'production') {
      throw new ServiceUnavailableException('AI generation is not configured.');
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
          max_tokens: maxTokens,
          messages,
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

    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new BadGatewayException(
        'The AI provider returned an empty response.',
      );
    }
    return content;
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
