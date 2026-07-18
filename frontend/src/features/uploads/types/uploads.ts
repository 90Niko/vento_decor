export interface UploadedImage {
  publicId: string;
  url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
  originalName: string;
}

export interface UploadResponse {
  images: UploadedImage[];
}
