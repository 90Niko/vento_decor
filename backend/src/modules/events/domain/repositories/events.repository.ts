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
  email: string | null;
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
  abstract upsertGuest(data: {
    eventId: number;
    email: string;
    name: string;
    sessionTokenHash: string;
  }): Promise<GuestRecord>;
  abstract createOtpChallenge(data: {
    eventId: number;
    email: string;
    name: string;
    codeHash: string;
    expiresAt: Date;
  }): Promise<void>;
  abstract consumeOtpChallenge(data: {
    eventId: number;
    email: string;
    codeHash: string;
  }): Promise<{ name: string } | null>;
  abstract findGuestBySession(data: {
    eventId: number;
    sessionTokenHash: string;
  }): Promise<GuestRecord | null>;
}
