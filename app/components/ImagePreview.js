import React from "react";
import Image from "next/image";

export default function ImagePreview({ src, alt, width, height, onLoad }) {
  return (
    <Image
      src={src}
      alt={alt}
      className="rounded-lg shadow-lg"
      height={0}
      width={0}
      onLoadingComplete={onLoad}
      style={{ width: width || "auto", height: height || "auto" }}
    />
  );
}
