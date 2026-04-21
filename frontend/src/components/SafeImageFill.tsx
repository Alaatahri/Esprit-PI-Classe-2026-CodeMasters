"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";
import { isBackendLocalMediaUrl } from "@/lib/backend-public-url";

type Props = Omit<ImageProps, "src"> & {
  src: string;
  /** Utilisé si `src` renvoie 404 (ex. ancien lien Unsplash supprimé). */
  fallbackSrc: string;
};

/**
 * `next/image` avec `fill` : si `src` échoue (404), bascule sur `fallbackSrc`.
 */
export function SafeImageFill({ src, fallbackSrc, onError, alt = "", ...rest }: Props) {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <Image
      {...rest}
      alt={alt}
      src={current}
      unoptimized={
        rest.unoptimized === true ||
        isBackendLocalMediaUrl(current) ||
        isBackendLocalMediaUrl(fallbackSrc)
      }
      onError={(e) => {
        if (current !== fallbackSrc) {
          setCurrent(fallbackSrc);
        }
        onError?.(e);
      }}
    />
  );
}
