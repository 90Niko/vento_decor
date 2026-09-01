import { getApiUrl } from "@/shared/api/client";
import type { UploadResponse } from "../types/uploads";

interface UploadImagesInput {
  files: File[];
  uploadPath: string;
  authorizationToken?: string;
  onProgress: (value: number) => void;
}

const UPLOAD_BATCH_SIZE = 2;

export class PartialUploadError extends Error {
  constructor(
    message: string,
    readonly uploadedCount: number,
  ) {
    super(message);
    this.name = "PartialUploadError";
  }
}

export async function uploadImages({
  files,
  uploadPath,
  authorizationToken,
  onProgress,
}: UploadImagesInput): Promise<UploadResponse> {
  const images: UploadResponse["images"] = [];

  for (let offset = 0; offset < files.length; offset += UPLOAD_BATCH_SIZE) {
    const batch = files.slice(offset, offset + UPLOAD_BATCH_SIZE);
    try {
      const response = await uploadBatch({
        files: batch,
        uploadPath,
        authorizationToken,
        onProgress: (batchProgress) => {
          const completed = offset;
          const current = (batchProgress / 100) * batch.length;
          onProgress(Math.round(((completed + current) / files.length) * 100));
        },
      });
      images.push(...response.images);
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Възникна неочаквана грешка.";
      throw new PartialUploadError(reason, images.length);
    }
  }

  return { images };
}

function uploadBatch({
  files,
  uploadPath,
  authorizationToken,
  onProgress,
}: UploadImagesInput): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${getApiUrl()}${uploadPath}`);
    request.withCredentials = true;
    if (authorizationToken) {
      request.setRequestHeader("Authorization", `Bearer ${authorizationToken}`);
    }
    request.timeout = 120_000;
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable)
        onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(readUploadError(request)));
        return;
      }
      try {
        resolve(JSON.parse(request.responseText) as UploadResponse);
      } catch {
        reject(new Error("Сървърът върна неочакван отговор."));
      }
    });
    request.addEventListener("error", () =>
      reject(new Error("Няма връзка със сървъра.")),
    );
    request.addEventListener("timeout", () =>
      reject(new Error("Качването отне твърде дълго. Опитай отново.")),
    );
    request.send(formData);
  });
}

function readUploadError(request: XMLHttpRequest): string {
  const fallback = `Качването не беше успешно (код ${request.status}).`;
  try {
    const response = JSON.parse(request.responseText) as { message?: unknown };
    if (typeof response.message === "string") return response.message;
    if (
      Array.isArray(response.message) &&
      response.message.every((item) => typeof item === "string")
    )
      return response.message.join(" ");
  } catch {
    // Keep the status-based message for a non-JSON response.
  }
  return fallback;
}
