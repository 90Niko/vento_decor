import { getApiUrl } from "@/shared/api/client";
import type {
  AdminEventDetails,
  AdminEventSummary,
  CreateEventInput,
  CreatedEvent,
  GuestRegistration,
  PublicEvent,
} from "../types/events";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

export const eventsService = {
  generateEventCopyResponse(payload: {
    title: string;
    eventType: string;
    location?: string;
    startAt?: string;
    tone: "warm" | "playful" | "formal";
    keywords?: string;
    sourceText?: string;
  }): Promise<Response> {
    return fetch(`${getApiUrl()}/ai/event-copy`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  getPublicEventResponse(
    publicId: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/public/${publicId}`, { signal });
  },

  registerGuestResponse(
    publicId: string,
    name: string,
    email: string,
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/public/${publicId}/guests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
  },

  requestGuestOtpResponse(
    publicId: string,
    name: string,
    email: string,
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/public/${publicId}/guest-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
  },

  verifyGuestOtpResponse(
    publicId: string,
    email: string,
    code: string,
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/public/${publicId}/guest-otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
  },

  getManagerQuizResponse(publicId: string): Promise<Response> {
    return fetch(`${getApiUrl()}/events/admin/${publicId}/quiz`, {
      credentials: "include",
      cache: "no-store",
    });
  },

  updateManagerQuizResponse(
    publicId: string,
    quiz: {
      enabled: boolean;
      hasCorrectAnswers: boolean;
      title: string;
      questions: Array<{
        prompt: string;
        options: string[];
        correctOption: number;
      }>;
    },
  ): Promise<Response> {
    const payload = {
      enabled: quiz.enabled,
      hasCorrectAnswers: quiz.hasCorrectAnswers,
      title: quiz.title,
      questions: quiz.questions.map(({ prompt, options, correctOption }) => ({
        prompt,
        options,
        correctOption,
      })),
    };

    return fetch(`${getApiUrl()}/events/admin/${publicId}/quiz`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  getPublicQuizResponse(
    publicId: string,
    guestToken: string,
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/public/${publicId}/quiz`, {
      headers: { Authorization: `Bearer ${guestToken}` },
      cache: "no-store",
    });
  },

  submitQuizAttemptResponse(
    publicId: string,
    guestToken: string,
    answers: number[],
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/public/${publicId}/quiz/attempts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${guestToken}`,
      },
      body: JSON.stringify({ answers }),
    });
  },

  getQuizReviewResponse(
    publicId: string,
    guestToken: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/public/${publicId}/quiz/review`, {
      headers: { Authorization: `Bearer ${guestToken}` },
      cache: "no-store",
      signal,
    });
  },

  getAdminEventsResponse(): Promise<Response> {
    return fetch(`${getApiUrl()}/events/admin`, {
      cache: "no-store",
      credentials: "include",
    });
  },

  getCreatorEventsResponse(): Promise<Response> {
    return fetch(`${getApiUrl()}/events/mine`, {
      cache: "no-store",
      credentials: "include",
    });
  },

  getAdminEventResponse(
    publicId: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/admin/${publicId}`, {
      cache: "no-store",
      credentials: "include",
      signal,
    });
  },

  createEventResponse(payload: CreateEventInput): Promise<Response> {
    return fetch(`${getApiUrl()}/events`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  updateEventResponse(
    publicId: string,
    payload: CreateEventInput,
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/admin/${publicId}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  },

  deleteEventResponse(publicId: string): Promise<Response> {
    return fetch(`${getApiUrl()}/events/admin/${publicId}`, {
      method: "DELETE",
      credentials: "include",
    });
  },

  getGuestGalleryResponse(
    publicId: string,
    guestToken: string,
    signal?: AbortSignal,
  ): Promise<Response> {
    return fetch(`${getApiUrl()}/events/public/${publicId}/images`, {
      headers: { Authorization: `Bearer ${guestToken}` },
      cache: "no-store",
      signal,
    });
  },

  toggleGuestImageLikeResponse(
    publicId: string,
    imageId: number,
    guestToken: string,
  ): Promise<Response> {
    return fetch(
      `${getApiUrl()}/events/public/${publicId}/images/${imageId}/like`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${guestToken}` },
      },
    );
  },

  getGuestImageDownloadResponse(
    publicId: string,
    imageId: number,
    guestToken: string,
  ): Promise<Response> {
    return fetch(
      `${getApiUrl()}/events/public/${publicId}/images/${imageId}/download`,
      { headers: { Authorization: `Bearer ${guestToken}` } },
    );
  },

  deleteImageResponse(imageId: number): Promise<Response> {
    return fetch(`${getApiUrl()}/admin/event-images/${imageId}`, {
      method: "DELETE",
      credentials: "include",
    });
  },

  async getPublicEvent(
    publicId: string,
    signal?: AbortSignal,
  ): Promise<PublicEvent> {
    const response = await fetch(`${getApiUrl()}/events/public/${publicId}`, {
      signal,
    });
    if (!response.ok) {
      throw new ApiError(
        "Събитието не може да бъде заредено.",
        response.status,
      );
    }
    return response.json() as Promise<PublicEvent>;
  },

  async registerGuest(
    publicId: string,
    name: string,
  ): Promise<GuestRegistration> {
    const response = await fetch(
      `${getApiUrl()}/events/public/${publicId}/guests`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      },
    );
    if (!response.ok) {
      throw new ApiError(
        "Гостът не може да бъде регистриран.",
        response.status,
      );
    }
    return response.json() as Promise<GuestRegistration>;
  },

  async getAdminEvents(): Promise<AdminEventSummary[]> {
    const response = await fetch(`${getApiUrl()}/events/admin`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!response.ok) {
      throw new ApiError(
        "Събитията не могат да бъдат заредени.",
        response.status,
      );
    }
    return response.json() as Promise<AdminEventSummary[]>;
  },

  async getAdminEvent(
    publicId: string,
    signal?: AbortSignal,
  ): Promise<AdminEventDetails> {
    const response = await fetch(`${getApiUrl()}/events/admin/${publicId}`, {
      cache: "no-store",
      credentials: "include",
      signal,
    });
    if (!response.ok) {
      throw new ApiError(
        "Галерията на събитието не може да бъде заредена.",
        response.status,
      );
    }
    return response.json() as Promise<AdminEventDetails>;
  },

  async createEvent(payload: CreateEventInput): Promise<CreatedEvent> {
    const response = await fetch(`${getApiUrl()}/events`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new ApiError(await readError(response), response.status);
    }
    return response.json() as Promise<CreatedEvent>;
  },

  async deleteImage(imageId: number): Promise<void> {
    const response = await fetch(
      `${getApiUrl()}/admin/event-images/${imageId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
    if (!response.ok) {
      throw new ApiError(
        `Ð¡Ð½Ð¸Ð¼ÐºÐ°Ñ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ð±ÑŠÐ´Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚Ð° (ÐºÐ¾Ð´ ${response.status}).`,
        response.status,
      );
    }
  },
};

async function readError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { message?: unknown };
    if (typeof payload.message === "string") {
      return payload.message;
    }
    if (
      Array.isArray(payload.message) &&
      payload.message.every((item) => typeof item === "string")
    ) {
      return payload.message.join(" ");
    }
  } catch {
    // A status-based error is used for non-JSON responses.
  }

  return `Ð¡ÑŠÐ±Ð¸Ñ‚Ð¸ÐµÑ‚Ð¾ Ð½Ðµ Ð±ÐµÑˆÐµ ÑÑŠÐ·Ð´Ð°Ð´ÐµÐ½Ð¾ (ÐºÐ¾Ð´ ${response.status}).`;
}
