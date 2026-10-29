"use client";

const maxInputSize = 15 * 1024 * 1024;
const targetOutputSize = 1.5 * 1024 * 1024;
const maxDimension = 2400;
const acceptedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const acceptedExtensions = /\.(jpe?g|png|webp|heic|heif)$/i;
const heicExtensions = /\.(heic|heif)$/i;

function getImageKitEndpoint(): URL {
  const endpoint =
    process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ??
    "https://ik.imagekit.io/sxvg5dlmq";
  try {
    const url = new URL(endpoint);
    if (url.protocol === "https:" && url.hostname === "ik.imagekit.io") {
      return url;
    }
  } catch {
    return new URL("https://ik.imagekit.io/sxvg5dlmq");
  }
  return new URL("https://ik.imagekit.io/sxvg5dlmq");
}

function isHeicFile(file: File): boolean {
  return (
    file.type === "image/heic" ||
    file.type === "image/heif" ||
    heicExtensions.test(file.name)
  );
}

async function convertHeic(file: File): Promise<Blob> {
  const { default: heic2any } = await import("heic2any");
  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });
  return Array.isArray(converted) ? converted[0] : converted;
}

async function loadBitmap(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(blob, { imageOrientation: "from-image" });
    } catch {
      return createImageBitmap(blob);
    }
  }

  const source = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.src = source;
    await image.decode();
    return image;
  } finally {
    URL.revokeObjectURL(source);
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo procesar la foto seleccionada."));
      },
      type,
      quality,
    );
  });
}

export async function prepareProductImage(file: File): Promise<Blob> {
  if (file.size > maxInputSize) {
    throw new Error("La foto debe pesar menos de 15 MB.");
  }
  if (
    !acceptedExtensions.test(file.name) ||
    (!isHeicFile(file) && !acceptedMimeTypes.has(file.type))
  ) {
    throw new Error("Elige una imagen JPEG, PNG, WebP o HEIC.");
  }

  const source = isHeicFile(file) ? await convertHeic(file) : file;
  const bitmap = await loadBitmap(source);
  let width = bitmap.width;
  let height = bitmap.height;
  const initialScale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.max(1, Math.round(width * initialScale));
  height = Math.max(1, Math.round(height * initialScale));

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    if ("close" in bitmap) bitmap.close();
    throw new Error("El navegador no pudo preparar la foto.");
  }

  let result: Blob | undefined;
  try {
    for (let scalePass = 0; scalePass < 6; scalePass++) {
      canvas.width = width;
      canvas.height = height;
      context.clearRect(0, 0, width, height);
      context.drawImage(bitmap, 0, 0, width, height);

      for (let quality = 0.9; quality >= 0.66; quality -= 0.08) {
        result = await canvasToBlob(canvas, "image/webp", quality);
        if (result.type !== "image/webp") {
          result = await canvasToBlob(canvas, "image/jpeg", quality);
        }
        if (result.size <= targetOutputSize) return result;
      }

      width = Math.max(1, Math.round(width * 0.82));
      height = Math.max(1, Math.round(height * 0.82));
    }
  } finally {
    if ("close" in bitmap) bitmap.close();
  }

  if (!result || result.size > targetOutputSize) {
    throw new Error(
      "No se pudo reducir la foto a menos de 1,5 MB. Prueba con otra imagen.",
    );
  }
  return result;
}

export function getImageKitOptimizedUrl(
  source: string,
  width: number,
): string {
  try {
    const url = new URL(source);
    const endpoint = getImageKitEndpoint();
    if (
      url.protocol === "https:" &&
      url.origin === endpoint.origin &&
      url.pathname.startsWith(`${endpoint.pathname.replace(/\/+$/, "")}/`)
    ) {
      url.searchParams.set("tr", `w-${width},q-80,f-auto`);
      return url.toString();
    }
  } catch {
    return source;
  }
  return source;
}

export function isImageKitUrl(source: string): boolean {
  try {
    const url = new URL(source);
    const endpoint = getImageKitEndpoint();
    return (
      url.protocol === "https:" &&
      url.origin === endpoint.origin &&
      url.pathname.startsWith(`${endpoint.pathname.replace(/\/+$/, "")}/`)
    );
  } catch {
    return false;
  }
}
