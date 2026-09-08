import type { ImageLoaderProps } from "next/image";

// Resize at the media CDN so gallery thumbnails never download the originals.
export function galleryImageLoader({ src, width }: ImageLoaderProps): string {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return src;
  }
  if (url.hostname !== "res.cloudinary.com") return src;
  const marker = url.pathname.includes("/video/upload/")
    ? "/video/upload/"
    : "/image/upload/";
  if (!url.pathname.includes(marker)) return src;
  const isVideo = marker === "/video/upload/";
  if (isVideo) {
    url.pathname = url.pathname.replace(/\.[^/.]+$/, ".jpg");
  }
  url.pathname = url.pathname.replace(
    marker,
    `${marker}c_limit,w_${width}/f_auto/q_auto/${isVideo ? "so_0/" : ""}`,
  );
  return url.toString();
}
