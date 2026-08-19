/**
 * Client-only canvas helpers for tile images. iPhone photos land as multi-MB
 * HEIC/JPEG; drawing to a fixed-size canvas both center-crops to a square
 * and re-encodes to WebP in one step, so a tile image goes from a few MB
 * down to tens of KB before it ever hits Supabase Storage.
 */
export async function resizeImageToSquareWebp(
  file: File,
  size = 512,
  quality = 0.85,
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas isn't supported in this browser.");

    // Cover-fit: scale so the shorter side fills `size`, then center-crop.
    const scale = Math.max(size / bitmap.width, size / bitmap.height);
    const w = bitmap.width * scale;
    const h = bitmap.height * scale;
    ctx.drawImage(bitmap, (size - w) / 2, (size - h) / 2, w, h);

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode image."))),
        "image/webp",
        quality,
      );
    });
  } finally {
    bitmap.close();
  }
}
