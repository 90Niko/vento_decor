"use client";

import {
  ChangeEvent,
  DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { uploadImages } from "@/features/uploads/services/uploads.service";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".jfif",
  ".png",
  ".webp",
  ".gif",
  ".avif",
  ".heic",
  ".heif",
  ".mp4",
  ".mov",
  ".webm",
  ".m4v",
  ".mpeg",
  ".mpg",
];

interface SelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAcceptedMedia(file: File): boolean {
  const extension = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
  return (
    file.type.startsWith("image/") ||
    file.type.startsWith("video/") ||
    ACCEPTED_EXTENSIONS.includes(extension)
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Снимката не може да бъде прочетена."));
    reader.onerror = () =>
      reject(new Error("Снимката не може да бъде прочетена."));
    reader.readAsDataURL(file);
  });
}

interface UploadStudioProps {
  uploadPath?: string;
  authorizationToken?: string;
  inputId?: string;
  theme?: {
    primary: string;
    accent: string;
    background: string;
  };
  onUploaded?: () => void;
}

export function UploadStudio({
  uploadPath = "/uploads/images",
  authorizationToken,
  inputId,
  theme = {
    primary: "#173b57",
    accent: "#5aa9d6",
    background: "#eaf6ff",
  },
  onUploaded,
}: UploadStudioProps = {}) {
  const [selected, setSelected] = useState<SelectedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const previewUrls = useRef<string[]>([]);

  useEffect(() => {
    const urls = previewUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const addFiles = async (files: FileList | File[]) => {
    setError(null);
    setMessage(null);

    const existing = new Set(
      selected.map(
        ({ file }) => `${file.name}-${file.size}-${file.lastModified}`,
      ),
    );
    const incoming = Array.from(files).filter((file) => {
      const key = `${file.name}-${file.size}-${file.lastModified}`;
      return isAcceptedMedia(file) &&
        file.size <= MAX_FILE_SIZE &&
        !existing.has(key);
    });
    const availableSlots = MAX_FILES - selected.length;
    const accepted = await Promise.all(
      incoming.slice(0, availableSlots).map(async (file) => {
        const previewUrl = file.type.startsWith("video/")
          ? URL.createObjectURL(file)
          : await readFileAsDataUrl(file);
        if (file.type.startsWith("video/")) {
          previewUrls.current.push(previewUrl);
        }
        return {
          id: `${file.name}-${file.size}-${file.lastModified}`,
          file,
          previewUrl,
        };
      }),
    );

    if (accepted.length < Array.from(files).length) {
      setError(
        "Някои файлове са пропуснати. Избери снимки или видеа до 100 MB.",
      );
    } else if (accepted.length > 0) {
      setMessage(
        `${accepted.length} ${accepted.length === 1 ? "снимка е избрана" : "снимки са избрани"}. Натисни зеления бутон „Качи избраните снимки“.`,
      );
    }

    setSelected((current) => [...current, ...accepted]);
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      void addFiles(event.target.files);
      if (event.target.files.length > 0) {
        window.setTimeout(() => {
          formRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 0);
      }
    }
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(event.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setSelected((current) => {
      const image = current.find((item) => item.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
        previewUrls.current = previewUrls.current.filter(
          (url) => url !== image.previewUrl,
        );
      }
      return current.filter((item) => item.id !== id);
    });
  };

  const handleUpload = async () => {
    if (isUploading) return;
    if (selected.length === 0) {
      setError("Избери поне една снимка.");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setError(null);
    setMessage(null);

    try {
      const response = await uploadImages({
        files: selected.map(({ file }) => file),
        uploadPath,
        authorizationToken,
        onProgress: setProgress,
      });
      selected.forEach(({ previewUrl }) => URL.revokeObjectURL(previewUrl));
      previewUrls.current = [];
      setSelected([]);
      setProgress(100);
      const uploadMessage =
        response.images.length === 1
          ? "Файлът е качен успешно."
          : `${response.images.length} файла са качени успешно.`;
      setMessage(uploadMessage);
      onUploaded?.();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Възникна неочаквана грешка.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <form
        ref={formRef}
        onSubmit={(event) => {
          event.preventDefault();
          void handleUpload();
        }}
        className="surface-card rounded-[2rem] p-0 sm:p-4"
      >
        {selected.length === 0 && <label
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`group relative flex min-h-72 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-none border border-dashed px-6 py-12 text-center transition duration-300 sm:min-h-96 sm:rounded-[1.6rem] ${
            isDragging
              ? "scale-[0.99] border-[#5aa9d6] bg-[#eaf6ff]"
              : "border-[#173b57]/20 bg-[linear-gradient(145deg,rgba(234,246,255,.82),rgba(255,255,255,.72))] hover:border-[#5aa9d6]/60 hover:bg-[#eaf6ff]"
          }`}
        >
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*,video/mp4,video/quicktime,video/webm,video/x-m4v,video/mpeg,.heic,.heif,.jfif,.avif,.svg"
            multiple
            onChange={handleInput}
            className="sr-only"
            disabled={isUploading}
            suppressHydrationWarning
          />
          <span
            className="mb-6 grid h-16 w-16 place-items-center rounded-2xl text-white shadow-[0_14px_35px_rgba(23,59,87,.22)] transition duration-300 group-hover:-translate-y-1 group-hover:-rotate-3"
            style={{ backgroundColor: theme.primary }}
          >
            <UploadIcon />
          </span>
          <span className="text-xl font-semibold tracking-[-0.02em]">
            Пусни снимките и видеата тук
          </span>
          <span className="mt-2 text-sm leading-6 text-[#173b57]/68">
            или натисни, за да избереш от устройството
          </span>
          <span className="mt-5 rounded-full bg-white/80 px-4 py-2 text-xs font-medium text-[#173b57]/68 shadow-sm">
            Снимки, MP4, MOV и WebM · до 100 MB · максимум 10
          </span>
        </label>}

        {selected.length > 0 && (
          <div className="mt-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold">Готови за качване</h2>
              <span className="text-sm text-[#173b57]/68">
                {selected.length}/{MAX_FILES}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {selected.map((image) => (
                <div
                  key={image.id}
                  className="group relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#eaf6ff] shadow-sm"
                >
                  {image.file.type.startsWith("video/") ? (
                    <video
                      src={image.previewUrl}
                      className="absolute inset-0 h-full w-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <div
                      role="img"
                      aria-label={`Преглед на ${image.file.name}`}
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                      style={{ backgroundImage: `url(${image.previewUrl})` }}
                    />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pt-8 pb-3 text-left text-white">
                    <p className="truncate text-xs font-medium">
                      {image.file.name}
                    </p>
                    <p className="mt-0.5 text-[11px] text-white/70">
                      {formatBytes(image.file.size)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    className="absolute top-2 right-2 grid h-8 w-8 place-items-center rounded-full bg-[#173b57]/70 text-white backdrop-blur transition hover:bg-[#5aa9d6]"
                    aria-label={`Премахни ${image.file.name}`}
                  >
                    <CloseIcon />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div aria-live="polite" className="mt-5 min-h-6 text-sm">
          {error && <p className="font-medium text-[#173b57]">{error}</p>}
          {message && <p className="font-medium text-[#5aa9d6]">{message}</p>}
        </div>

        {isUploading && (
          <div className="mt-2" aria-label={`Качване ${progress}%`}>
            <div className="mb-2 flex justify-between text-xs font-medium">
              <span>Качване към галерията</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#eaf6ff]">
              <div
                className="h-full rounded-full bg-[#5aa9d6] transition-[width] duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {selected.length > 0 && <button
          type="button"
          onClick={() => void handleUpload()}
          disabled={isUploading}
          className="mt-5 flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          style={{ backgroundColor: theme.primary }}
        >
          {isUploading ? "Качване…" : "Качи избраните снимки"}
          {!isUploading && <ArrowIcon />}
        </button>}
      </form>

    </div>
  );
}

function UploadIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 14.5v3A2.5 2.5 0 007.5 20h9a2.5 2.5 0 002.5-2.5v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.75 9h10.5m-4-4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
