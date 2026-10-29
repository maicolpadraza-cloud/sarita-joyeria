"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import {
  getImageKitOptimizedUrl,
  isImageKitUrl,
} from "@/lib/prepare-product-image";

type ProductImageProps = Omit<ImageProps, "src"> & {
  src: string;
  transformWidth?: number;
};

export default function ProductImage({
  src,
  transformWidth = 800,
  ...props
}: ProductImageProps) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const isImageKit = isImageKitUrl(src);
  const isBlob = src.startsWith("blob:");
  const { onError, ...imageProps } = props;
  const hasError = failedSource === src;

  return (
    <Image
      {...imageProps}
      alt={imageProps.alt ?? ""}
      src={
        hasError
          ? "/logo-luna.png"
          : isImageKit
            ? getImageKitOptimizedUrl(src, transformWidth)
            : src
      }
      unoptimized={isImageKit || isBlob}
      onError={(event) => {
        setFailedSource(src);
        onError?.(event);
      }}
    />
  );
}
