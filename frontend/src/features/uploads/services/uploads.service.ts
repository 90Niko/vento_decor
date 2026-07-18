import { getApiUrl } from "@/shared/api/client";
import type { UploadResponse } from "../types/uploads";

interface UploadImagesInput {
  files: File[];
  uploadPath: string;
  authorizationToken?: string;
  onProgress: (value: number) => void;
}

export function uploadImages({ files, uploadPath, authorizationToken, onProgress }: UploadImagesInput): Promise<UploadResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${getApiUrl()}${uploadPath}`);
    if (authorizationToken) {
      request.setRequestHeader("Authorization", `Bearer ${authorizationToken}`);
    }
    request.timeout = 120_000;
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    });
    request.addEventListener("load", () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new Error(readUploadError(request)));
        return;
      }
      try {
        resolve(JSON.parse(request.responseText) as UploadResponse);
      } catch {
        reject(new Error("Ð¡ÑŠÑ€Ð²ÑŠÑ€ÑŠÑ‚ Ð²ÑŠÑ€Ð½Ð° Ð½ÐµÐ¾Ñ‡Ð°ÐºÐ²Ð°Ð½ Ð¾Ñ‚Ð³Ð¾Ð²Ð¾Ñ€."));
      }
    });
    request.addEventListener("error", () => reject(new Error("ÐÑÐ¼Ð° Ð²Ñ€ÑŠÐ·ÐºÐ° ÑÑŠÑ ÑÑŠÑ€Ð²ÑŠÑ€Ð°.")));
    request.addEventListener("timeout", () => reject(new Error("ÐšÐ°Ñ‡Ð²Ð°Ð½ÐµÑ‚Ð¾ Ð¾Ñ‚Ð½Ðµ Ñ‚Ð²ÑŠÑ€Ð´Ðµ Ð´ÑŠÐ»Ð³Ð¾. ÐžÐ¿Ð¸Ñ‚Ð°Ð¹ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾.")));
    request.send(formData);
  });
}

function readUploadError(request: XMLHttpRequest): string {
  const message = `ÐšÐ°Ñ‡Ð²Ð°Ð½ÐµÑ‚Ð¾ Ð½Ðµ Ð±Ðµ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾ (ÐºÐ¾Ð´ ${request.status}).`;
  try {
    const response = JSON.parse(request.responseText) as { message?: unknown };
    if (typeof response.message === "string") return response.message;
    if (Array.isArray(response.message) && response.message.every((item) => typeof item === "string")) return response.message.join(" ");
  } catch {
    // Keep the status-based message for a non-JSON response.
  }
  return message;
}
