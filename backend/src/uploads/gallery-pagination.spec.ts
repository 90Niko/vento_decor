import { BadRequestException } from '@nestjs/common';
import { UploadsService } from './uploads.service';
import { EventUploadsController } from './event-uploads.controller';
import {
  EventImagesRepository,
  GuestGalleryImage,
} from './domain/event-images.repository';
import { GuestAccessService } from '../modules/events/application/guest-access.service';
import { CloudinaryService } from '../infrastructure/storage/cloudinary/cloudinary.service';

describe('Guest gallery pagination', () => {
  const authenticate = jest.fn();
  const findAllByEventId = jest.fn();
  const service = new UploadsService(
    {} as CloudinaryService,
    { authenticate } as unknown as GuestAccessService,
    { findAllByEventId } as unknown as EventImagesRepository,
  );

  beforeEach(() => {
    jest.resetAllMocks();
    authenticate.mockResolvedValue({ event: { id: 7 }, guest: { id: 9 } });
  });

  it('traverses more than 500 images without duplicates even with inserts and deletes', async () => {
    let records = Array.from({ length: 550 }, (_, index) => ({
      id: 550 - index,
    }));
    findAllByEventId.mockImplementation(
      (
        eventId: number,
        guestId: number,
        page: { beforeId?: number; take: number },
      ) => {
        expect(eventId).toBe(7);
        expect(guestId).toBe(9);
        expect(page.take).toBe(25);
        return records
          .filter(
            (image) => page.beforeId === undefined || image.id < page.beforeId,
          )
          .slice(0, page.take);
      },
    );
    const first = await service.getGuestGalleryPage('event', 'token');
    expect(first.images).toHaveLength(24);
    expect(first.nextCursor).toBe(527);
    // The last item of the first page can be deleted without invalidating its cursor.
    records = [{ id: 551 }, ...records.filter((image) => image.id !== 527)];
    const seen: GuestGalleryImage[] = [...first.images];
    let cursor = first.nextCursor;
    while (cursor !== null) {
      const page = await service.getGuestGalleryPage('event', 'token', cursor);
      expect(page.images.length).toBeLessThanOrEqual(24);
      seen.push(...page.images);
      cursor = page.nextCursor;
    }
    expect(seen.map((image) => image.id)).toEqual(
      Array.from({ length: 550 }, (_, index) => 550 - index),
    );
    expect(authenticate).toHaveBeenCalledWith('event', 'token');
  });

  it('returns no next cursor for an empty gallery', async () => {
    findAllByEventId.mockResolvedValue([]);
    await expect(
      service.getGuestGalleryPage('event', 'token'),
    ).resolves.toEqual({ images: [], nextCursor: null });
  });

  it('does not query images when guest authentication fails', async () => {
    authenticate.mockRejectedValue(new Error('Unauthorized'));
    await expect(
      service.getGuestGalleryPage('event', 'bad-token'),
    ).rejects.toThrow('Unauthorized');
    expect(findAllByEventId).not.toHaveBeenCalled();
  });

  it.each(['0', '-1', '1.5', 'abc', 'Infinity', '9007199254740992'])(
    'rejects invalid cursor %s',
    (cursor) => {
      const controller = new EventUploadsController(service);
      expect(() =>
        controller.getGalleryPage('event', 'Bearer token', cursor),
      ).toThrow(BadRequestException);
    },
  );
});
