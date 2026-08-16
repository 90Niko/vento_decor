"use client";

import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { uploadImages } from "@/features/uploads/services/uploads.service";
import type { UploadedImage } from "@/features/uploads/types/uploads";

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
  const [uploaded, setUploaded] = useState<UploadedImage[]>([]);
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

  const addFiles = (files: FileList | File[]) => {
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
    const accepted = incoming.slice(0, availableSlots).map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.push(previewUrl);
      return {
        id: `${file.name}-${file.size}-${file.lastModified}`,
        file,
        previewUrl,
      };
    });

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
      addFiles(event.target.files);
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
    addFiles(event.dataTransfer.files);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
      setUploaded((current) => [...response.images, ...current]);
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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="surface-card rounded-[2rem] p-0 sm:p-4"
      >
        <label
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
        </label>

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

        <button
          type="submit"
          disabled={selected.length === 0 || isUploading}
          className={`bottom-4 z-20 mt-5 flex w-full items-center justify-center gap-3 rounded-full px-6 py-4 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 ${selected.length > 0 ? "sticky ring-4 ring-black/10" : ""}`}
          style={{ backgroundColor: theme.primary }}
        >
          {isUploading ? "Качване…" : "Качи избраните снимки"}
          {!isUploading && <ArrowIcon />}
        </button>
      </form>

      <aside
        className="rounded-none p-6 text-white shadow-none sm:rounded-[2rem] sm:p-8 sm:shadow-[0_24px_80px_rgba(23,59,87,0.18)] lg:sticky lg:top-28"
        style={{
          background: `linear-gradient(155deg, ${theme.primary}, ${theme.accent})`,
        }}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-white/65 uppercase">
              Последно качени
            </p>
            <h2 className="mt-2 text-2xl font-medium tracking-[-0.03em]">
              Твоите моменти
            </h2>
          </div>
          <span className="grid h-10 min-w-10 place-items-center rounded-full bg-white/10 text-sm font-semibold">
            {uploaded.length}
          </span>
        </div>

        {uploaded.length === 0 ? (
          <div className="mt-10 flex min-h-72 flex-col items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-7 text-center">
            <GalleryIcon />
            <p className="mt-5 font-medium">Галерията те очаква</p>
            <p className="mt-2 max-w-56 text-sm leading-6 text-white/70">
              Снимките, които споделиш, ще се появят тук веднага след качването.
            </p>
          </div>
        ) : (
          <div className="mt-7 grid grid-cols-2 gap-3">
            {uploaded.map((image) => (
              <a
                key={image.publicId}
                href={image.url}
                target="_blank"
                rel="noreferrer"
                className="group relative aspect-square overflow-hidden rounded-2xl bg-white/10"
                aria-label={`Отвори ${image.originalName}`}
              >
                {image.resourceType === "video" ? (
                  <video
                    src={image.url}
                    className="absolute inset-0 h-full w-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <span
                    role="img"
                    aria-label={image.originalName}
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${image.url})` }}
                  />
                )}
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pt-8 pb-3 text-[11px] text-white/80">
                  {image.width} × {image.height}
                </span>
              </a>
            ))}
          </div>
        )}

        <div className="mt-7 border-t border-white/10 pt-5 text-xs leading-5 text-white/65">
          Твоите снимки стават част от общата галерия на събитието.
        </div>
      </aside>
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

function GalleryIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true" className="text-[#eaf6ff]">
      <rect x="5" y="7" width="32" height="28" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="16" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 31l8.5-8 5.5 5 4.5-4 7.5 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
