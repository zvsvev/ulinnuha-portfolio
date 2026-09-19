const DEFAULT_MAX_DIM = 1600;
const JPEG_QUALITY = 0.82;
/** Leave already-light images untouched. */
const KEEP_UNDER_BYTES = 400 * 1024;

/**
 * Shrink a photo in the browser before upload.
 *
 * Phone photos are often several megabytes, which makes the feeds slow to
 * load — the grid requests every image. Resizing to a sane longest edge and
 * re-encoding cuts that by an order of magnitude. Falls back to the original
 * file whenever anything goes wrong, so an upload is never blocked.
 *
 * `maxDim` lets smaller surfaces (the profile picture) request a tighter cap.
 */
export async function downscaleImage(file: File, maxDim = DEFAULT_MAX_DIM): Promise<File> {
  if (!file.type.startsWith('image/')) return file;

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    // Format the browser cannot decode (e.g. HEIC) — upload untouched.
    return file;
  }

  const { width, height } = bitmap;
  const scale = Math.min(1, maxDim / Math.max(width, height));

  if (scale === 1 && file.size <= KEEP_UNDER_BYTES) {
    bitmap.close();
    return file;
  }

  const targetW = Math.max(1, Math.round(width * scale));
  const targetH = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  bitmap.close();

  // PNGs may carry transparency, so keep the format; everything else is a photo.
  const keepPng = file.type === 'image/png';
  const type = keepPng ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, keepPng ? undefined : JPEG_QUALITY),
  );

  if (!blob || blob.size >= file.size) return file;

  const name = `${file.name.replace(/\.[^.]+$/, '')}.${keepPng ? 'png' : 'jpg'}`;
  return new File([blob], name, { type });
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
