export interface EventImageUploadData {
  url: string;
  publicId: string;
  originalName: string;
}

export interface PersistedEventImage extends EventImageUploadData {
  id: number;
  position: number;
}

export interface StoredEventImage {
  id: number;
  url: string;
  publicId: string;
  creatorId: number | null;
}

export interface GuestGalleryImage {
  id: number;
  url: string;
  publicId: string;
  originalName: string | null;
  guestName: string | null;
  createdAt: Date;
  likeCount: number;
  likedByGuest: boolean;
}

export interface GuestGalleryPage {
  images: GuestGalleryImage[];
  nextCursor: number | null;
}

export abstract class EventImagesRepository {
  abstract createMany(data: {
    eventId: number;
    guestId: number;
    images: EventImageUploadData[];
  }): Promise<PersistedEventImage[]>;
  abstract findById(id: number): Promise<StoredEventImage | null>;
  abstract findByIdForEvent(
    id: number,
    eventId: number,
  ): Promise<StoredEventImage | null>;
  abstract findAllByEventId(
    eventId: number,
    guestId: number,
    page?: { beforeId?: number; take: number },
  ): Promise<GuestGalleryImage[]>;
  abstract toggleLike(data: {
    imageId: number;
    eventId: number;
    guestId: number;
  }): Promise<{ liked: boolean; likeCount: number } | null>;
  abstract deleteById(id: number): Promise<void>;
}
