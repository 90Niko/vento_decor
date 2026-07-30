export interface PublicEvent {
  publicId: string;
  title: string;
  description: string | null;
  startAt: string | null;
  endAt: string | null;
  location: string | null;
  eventType: string;
  uploadDeadline: string | null;
  coverImageUrl: string | null;
  themeColor: string;
  requireGuestOtp: boolean;
}

export interface GuestRegistration {
  guest: { id: number; name: string };
  token: string;
}

export interface EventImage {
  id: number;
  url: string;
  publicId: string;
  originalName: string | null;
  position: number;
  guestName: string | null;
  createdAt: string;
}

export interface AdminEventSummary {
  id: number;
  publicId: string;
  title: string;
  description: string | null;
  startAt: string | null;
  location: string | null;
  isActive: boolean;
  createdAt: string;
  guestCount: number;
  imageCount: number;
}

export interface AdminEventDetails extends AdminEventSummary {
  endAt: string | null;
  eventType: string;
  uploadDeadline: string | null;
  coverImageUrl: string | null;
  themeColor: string;
  requireGuestOtp: boolean;
  images: EventImage[];
}

export interface CreatedEvent extends PublicEvent {
  id: number;
  isActive: boolean;
  publicUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventInput {
  title: string;
  description?: string;
  location: string;
  startAt?: string;
  endAt?: string;
  eventType?: string;
  uploadDeadline?: string;
  coverImageUrl?: string;
  coverImagePublicId?: string;
  themeColor?: string;
  requireGuestOtp?: boolean;
}
