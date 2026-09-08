import { EventQuizService } from './event-quiz.service';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import { GuestAccessService } from './guest-access.service';

// This unit test injects database doubles and does not exercise Prisma errors.
jest.mock('../../../generated/prisma/client', () => ({
  Prisma: {},
  PrismaClient: class {},
}));

describe('Gallery quiz summary', () => {
  const authenticate = jest.fn();
  const findUnique = jest.fn();
  const findFirst = jest.fn();
  const findMany = jest.fn();
  const service = new EventQuizService(
    {
      events: { findUnique },
      event_quiz_attempts: { findFirst, findMany },
    } as unknown as PrismaService,
    { authenticate } as unknown as GuestAccessService,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    authenticate.mockResolvedValue({ event: { id: 7 }, guest: { id: 9 } });
    findUnique.mockResolvedValue({ quiz_has_correct_answers: false });
  });

  it('reads only the current guest score without loading every guest answer', async () => {
    findFirst.mockResolvedValue({ score: 2, total: 3 });
    await expect(service.getSummary('event', 'token')).resolves.toEqual({
      percentage: 67,
      hasCorrectAnswers: false,
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: { event_id: 7, guest_id: 9 },
      select: { score: true, total: true },
    });
    expect(findMany).not.toHaveBeenCalled();
  });

  it('does not show a score when the guest has not answered', async () => {
    findFirst.mockResolvedValue(null);
    await expect(service.getSummary('event', 'token')).resolves.toEqual({
      percentage: null,
      hasCorrectAnswers: false,
    });
  });

  it('keeps authentication before any quiz data lookup', async () => {
    authenticate.mockRejectedValue(new Error('Unauthorized'));
    await expect(service.getSummary('event', 'bad-token')).rejects.toThrow(
      'Unauthorized',
    );
    expect(findFirst).not.toHaveBeenCalled();
    expect(findUnique).not.toHaveBeenCalled();
  });
});
