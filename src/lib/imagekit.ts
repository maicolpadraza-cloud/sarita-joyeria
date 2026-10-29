import "server-only";

import { ImageKit } from "@imagekit/nodejs";

const productFolder = "/sarita/productos/";
const pageSize = 1000;

let client: ImageKit | undefined;

function getImageKitClient(): ImageKit {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("IMAGEKIT_PRIVATE_KEY is required.");
  }

  client ??= new ImageKit({ privateKey });
  return client;
}

export async function deleteProductImage(fileId: string): Promise<void> {
  const imageKit = getImageKitClient();
  const file = await imageKit.files.get(fileId);

  if (!file.filePath?.startsWith(productFolder)) {
    throw new Error("The ImageKit file is outside the product folder.");
  }

  await imageKit.files.delete(fileId);
}

export async function getProductImageStorageUsage(): Promise<number> {
  const imageKit = getImageKitClient();
  let skip = 0;
  let totalBytes = 0;

  while (true) {
    const files = await imageKit.assets.list({
      fileType: "image",
      limit: pageSize,
      path: productFolder,
      skip,
      type: "file",
    });

    for (const file of files) {
      if (typeof file.size !== "number" || !Number.isFinite(file.size)) {
        throw new Error("ImageKit returned an invalid file size.");
      }
      totalBytes += file.size;
    }

    if (files.length < pageSize) {
      return totalBytes;
    }
    skip += files.length;
  }
}
