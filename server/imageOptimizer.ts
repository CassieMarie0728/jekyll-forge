/**
 * Server-side image optimization pipeline using sharp.
 * Supports: resize, compress, WEBP conversion, EXIF strip, responsive sizes.
 */

import sharp from "sharp";

export interface OptimizeOptions {
  /** Max width in pixels. Preserves aspect ratio. Default: 1920 */
  maxWidth?: number;
  /** Max height in pixels. Preserves aspect ratio. Default: 1080 */
  maxHeight?: number;
  /** Output format. Default: 'webp' */
  format?: "webp" | "jpeg" | "png" | "avif" | "original";
  /** Quality 1-100. Default: 82 */
  quality?: number;
  /** Strip EXIF/metadata. Default: true */
  stripMetadata?: boolean;
  /** Generate responsive sizes (thumbnail, medium, large). Default: false */
  generateSizes?: boolean;
}

export interface OptimizedImage {
  data: Buffer;
  width: number;
  height: number;
  format: string;
  size: number;
  mimeType: string;
}

export interface OptimizedImageSet {
  original: OptimizedImage;
  thumbnail?: OptimizedImage;  // 300px
  medium?: OptimizedImage;     // 800px
  large?: OptimizedImage;      // 1200px
}

const FORMAT_MIME: Record<string, string> = {
  webp: "image/webp",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
  gif: "image/gif",
};

async function optimizeSingle(
  input: Buffer,
  options: OptimizeOptions & { targetWidth?: number }
): Promise<OptimizedImage> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    format = "webp",
    quality = 82,
    stripMetadata = true,
    targetWidth,
  } = options;

  const effectiveWidth = targetWidth || maxWidth;

  let pipeline = sharp(input, { failOn: "none" });

  // Strip EXIF/metadata — withMetadata(false) is not in all versions; use rotate() to strip orientation
  // and avoid passing metadata through by NOT calling withMetadata
  if (!stripMetadata) {
    pipeline = pipeline.withMetadata();
  }

  // Resize (never upscale)
  pipeline = pipeline.resize({
    width: effectiveWidth,
    height: targetWidth ? undefined : maxHeight,
    fit: "inside",
    withoutEnlargement: true,
  });

  // Format conversion
  if (format === "webp") {
    pipeline = pipeline.webp({ quality, effort: 4 });
  } else if (format === "jpeg") {
    pipeline = pipeline.jpeg({ quality, progressive: true, mozjpeg: true });
  } else if (format === "png") {
    pipeline = pipeline.png({ quality, compressionLevel: 8 });
  } else if (format === "avif") {
    pipeline = pipeline.avif({ quality, effort: 4 });
  }
  // "original" keeps the source format

  const { data, info } = await pipeline.toBuffer({ resolveWithObject: true });

  const mimeType = FORMAT_MIME[info.format] || "application/octet-stream";

  return {
    data,
    width: info.width,
    height: info.height,
    format: info.format,
    size: info.size,
    mimeType,
  };
}

/**
 * Optimize a single image with the given options.
 */
export async function optimizeImage(
  input: Buffer,
  options: OptimizeOptions = {}
): Promise<OptimizedImage> {
  return optimizeSingle(input, options);
}

/**
 * Optimize an image and generate responsive sizes (thumbnail, medium, large, original).
 */
export async function optimizeImageSet(
  input: Buffer,
  options: OptimizeOptions = {}
): Promise<OptimizedImageSet> {
  const [original, thumbnail, medium, large] = await Promise.all([
    optimizeSingle(input, options),
    optimizeSingle(input, { ...options, targetWidth: 300 }),
    optimizeSingle(input, { ...options, targetWidth: 800 }),
    optimizeSingle(input, { ...options, targetWidth: 1200 }),
  ]);

  return { original, thumbnail, medium, large };
}

/**
 * Get image metadata without processing.
 */
export async function getImageMetadata(input: Buffer) {
  const meta = await sharp(input).metadata();
  return {
    width: meta.width,
    height: meta.height,
    format: meta.format,
    size: input.length,
    hasExif: !!meta.exif,
    hasIcc: !!meta.icc,
    channels: meta.channels,
    density: meta.density,
  };
}

/**
 * Detect if a buffer is an image based on magic bytes.
 */
export function isImageBuffer(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true;
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true;
  // GIF: 47 49 46
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true;
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) return true;
  // AVIF/HEIC: check ftyp box
  if (buffer.length >= 12 && buffer.slice(4, 8).toString() === "ftyp") return true;
  return false;
}
