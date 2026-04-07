"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useState } from "react";

type Props = Omit<ImageProps, "src"> & {
  src: string;
  /** Utilisé si `src` renvoie 404 (ex. ancien lien Unsplash supprimé). */
  fallbackSrc: string;
};

/**
 * `next/image` avec `fill` : si `src` échoue (404), bascule sur `fallbackSrc`.
 */
export function SafeImageFill({ src, fallbackSrc, onError, ...rest }: Props) {
  const [current, setCurrent] = useState(src);

  useEffect(() => {
    setCurrent(src);
  }, [src]);

  return (
    <Image
      {...rest}
      src={current}
      onError={(e) => {
        if (current !== fallbackSrc) {
          setCurrent(fallbackSrc);
        }
        onError?.(e);
      }}
    />
  );
}
