export interface CreateEventRecord {
  title: string;
  description: string | null;
  startAt: Date | null;
  endAt: Date | null;
  location: string | null;
}

export interface EventRecord extends CreateEventRecord {
  id: number;
  publicId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GuestRecord {
  id: number;
  eventId: number;
  name: string;
  sessionTokenHash: string;
  createdAt: Date;
}

export interface AdminEventRecord extends EventRecord {
  guestCount: number;
  imageCount: number;
}

export interface AdminEventImageRecord {
  id: number;
  url: string;
  publicId: string;
  originalName: string | null;
  position: number;
  guestName: string | null;
  createdAt: Date;
}

export interface AdminEventDetailsRecord extends AdminEventRecord {
  images: AdminEventImageRecord[];
}

export abstract class EventsRepository {
  abstract create(data: CreateEventRecord): Promise<EventRecord>;
  abstract findAllForAdmin(): Promise<AdminEventRecord[]>;
  abstract findByPublicIdForAdmin(
    publicId: string,
  ): Promise<AdminEventDetailsRecord | null>;
  abstract findActiveByPublicId(publicId: string): Promise<EventRecord | null>;
  abstract createGuest(data: {
    eventId: number;
    name: string;
    sessionTokenHash: string;
  }): Promise<GuestRecord>;
  abstract findGuestBySession(data: {
    eventId: number;
    sessionTokenHash: string;
  }): Promise<GuestRecord | null>;
}
