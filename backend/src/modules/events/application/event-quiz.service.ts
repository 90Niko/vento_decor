import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { CreatorSession } from '../../auth/auth.service';
import { GuestAccessService } from './guest-access.service';
import { QuizQuestionDto } from '../presentation/dto/update-event-quiz.dto';

interface StoredQuizQuestion {
  prompt: string;
  options: string[];
  correctOption: number;
}

@Injectable()
export class EventQuizService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly guestAccess: GuestAccessService,
  ) {}

  async getForManager(publicId: string, creator: CreatorSession) {
    const event = await this.findManagedEvent(publicId, creator);
    const attempts = await this.prisma.event_quiz_attempts.findMany({
      where: { event_id: event.id },
      select: { score: true, total: true },
    });
    const averagePercent = attempts.length
      ? Math.round(
          attempts.reduce(
            (sum, attempt) =>
              sum +
              (attempt.total > 0 ? (attempt.score / attempt.total) * 100 : 0),
            0,
          ) / attempts.length,
        )
      : 0;

    return {
      enabled: event.quiz_enabled,
      title: event.quiz_title ?? '',
      questions: this.readQuestions(event.quiz_questions),
      stats: { attempts: attempts.length, averagePercent },
    };
  }

  async update(
    publicId: string,
    creator: CreatorSession,
    input: { enabled: boolean; title: string; questions: QuizQuestionDto[] },
  ) {
    const event = await this.findManagedEvent(publicId, creator);
    const questions = input.questions.map((question) => ({
      prompt: question.prompt.trim(),
      options: question.options.map((option) => option.trim()),
      correctOption: question.correctOption,
    }));
    if (input.enabled && questions.length === 0) {
      throw new BadRequestException('Add at least one quiz question.');
    }
    for (const question of questions) {
      if (
        !question.prompt ||
        question.options.some((option) => !option) ||
        question.correctOption >= question.options.length
      ) {
        throw new BadRequestException(
          'Each question needs valid options and one correct answer.',
        );
      }
    }

    await this.prisma.events.update({
      where: { id: event.id },
      data: {
        quiz_enabled: input.enabled,
        quiz_title: input.title.trim() || null,
        quiz_questions: questions,
      },
    });
    return { saved: true };
  }

  async getPublic(publicId: string, token: string | undefined) {
    const { event, guest } = await this.guestAccess.authenticate(
      publicId,
      token,
    );
    const [quiz, previousAttempt] = await Promise.all([
      this.prisma.events.findUnique({
        where: { id: event.id },
        select: {
          quiz_enabled: true,
          quiz_title: true,
          quiz_questions: true,
        },
      }),
      this.prisma.event_quiz_attempts.findFirst({
        where: { event_id: event.id, guest_id: guest.id },
        select: { id: true },
      }),
    ]);
    const questions = this.readQuestions(quiz?.quiz_questions);
    if (!quiz?.quiz_enabled || questions.length === 0 || previousAttempt) {
      return {
        enabled: false,
        completed: Boolean(previousAttempt),
        title: '',
        questions: [],
      };
    }
    return {
      enabled: true,
      completed: false,
      title: quiz.quiz_title || 'Колко добре познаваш домакините?',
      questions: questions.map(({ prompt, options }) => ({ prompt, options })),
    };
  }

  async submit(publicId: string, token: string | undefined, answers: number[]) {
    const { event, guest } = await this.guestAccess.authenticate(
      publicId,
      token,
    );
    const quiz = await this.prisma.events.findUnique({
      where: { id: event.id },
      select: { quiz_enabled: true, quiz_questions: true },
    });
    const questions = this.readQuestions(quiz?.quiz_questions);
    if (!quiz?.quiz_enabled || questions.length === 0) {
      throw new NotFoundException('The quiz is not enabled.');
    }
    const previousAttempt = await this.prisma.event_quiz_attempts.findFirst({
      where: { event_id: event.id, guest_id: guest.id },
      select: { id: true },
    });
    if (previousAttempt) {
      throw new ConflictException('This guest has already completed the quiz.');
    }
    if (
      answers.length !== questions.length ||
      answers.some(
        (answer, index) =>
          answer < 0 || answer >= questions[index].options.length,
      )
    ) {
      throw new BadRequestException('Submit one valid answer per question.');
    }
    const score = questions.reduce(
      (total, question, index) =>
        total + (question.correctOption === answers[index] ? 1 : 0),
      0,
    );
    try {
      await this.prisma.event_quiz_attempts.create({
        data: {
          event_id: event.id,
          guest_id: guest.id,
          score,
          total: questions.length,
          answers,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This guest has already completed the quiz.',
        );
      }
      throw error;
    }
    return { score, total: questions.length };
  }

  private async findManagedEvent(publicId: string, creator: CreatorSession) {
    const event = await this.prisma.events.findFirst({
      where: {
        public_id: publicId,
        ...(creator.role === 'ADMIN' ? {} : { creator_id: creator.id }),
      },
      select: {
        id: true,
        quiz_enabled: true,
        quiz_title: true,
        quiz_questions: true,
      },
    });
    if (!event) throw new NotFoundException('Event not found.');
    return event;
  }

  private readQuestions(value: Prisma.JsonValue | null | undefined) {
    if (!Array.isArray(value)) return [];
    return value.filter(this.isQuestion) as unknown as StoredQuizQuestion[];
  }

  private readonly isQuestion = (
    value: Prisma.JsonValue,
  ): value is Prisma.JsonObject => {
    if (!value || Array.isArray(value) || typeof value !== 'object')
      return false;
    return (
      typeof value.prompt === 'string' &&
      Array.isArray(value.options) &&
      value.options.every((option) => typeof option === 'string') &&
      typeof value.correctOption === 'number'
    );
  };
}
