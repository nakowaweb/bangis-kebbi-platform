import { useState, type ImgHTMLAttributes } from "react";

/**
 * Image that quietly disappears when its file is missing, so visitors never see
 * a broken-image icon or leftover alt text. Renders nothing when there is no source.
 */
export function SafeImage({ src, onError, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <img
      {...props}
      src={src}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
