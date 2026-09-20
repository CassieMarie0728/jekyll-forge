export async function optimizeUpload(
  file: File
): Promise<{ file: File; width?: number; height?: number }> {
  // Preserve animation and SVG markup; only decode supported still images.
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    return { file };
  const bitmap = await createImageBitmap(file);
  try {
    const ratio = Math.min(1, 1920 / bitmap.width, 1920 / bitmap.height);
    const width = Math.max(1, Math.round(bitmap.width * ratio)),
      height = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return { file };
    context.drawImage(bitmap, 0, 0, width, height);
    const blob = await new Promise<Blob | null>(resolve =>
      canvas.toBlob(resolve, "image/webp", 0.82)
    );
    if (!blob || blob.type !== "image/webp") return { file };
    return {
      file: new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
        type: "image/webp",
      }),
      width,
      height,
    };
  } finally {
    bitmap.close();
  }
}
export function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = () => resolve(String(reader.result).split(",")[1]);
    reader.readAsDataURL(file);
  });
}
