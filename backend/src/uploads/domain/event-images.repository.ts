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
}

export interface GuestGalleryImage {
  id: number;
  url: string;
  publicId: string;
  originalName: string | null;
  guestName: string | null;
  createdAt: Date;
}

export abstract class EventImagesRepository {
  abstract createMany(data: {
    eventId: number;
    guestId: number;
    images: EventImageUploadData[];
  }): Promise<PersistedEventImage[]>;
  abstract findById(id: number): Promise<StoredEventImage | null>;
  abstract findAllByEventId(eventId: number): Promise<GuestGalleryImage[]>;
  abstract deleteById(id: number): Promise<void>;
}
