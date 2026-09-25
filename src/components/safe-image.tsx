import { useEffect, useState, type ImgHTMLAttributes } from "react";

type SafeImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fallbackSrc?: string;
};

/**
 * Image that quietly disappears when its file is missing, so visitors never see
 * a broken-image icon or leftover alt text. Renders nothing when there is no source.
 */
export function SafeImage({ src, fallbackSrc, onError, ...props }: SafeImageProps) {
  const [failed, setFailed] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    setFailed(false);
    setUsingFallback(false);
  }, [src, fallbackSrc]);

  const resolvedSrc = usingFallback ? fallbackSrc : src;
  if (!resolvedSrc || failed) return null;
  return (
    <img
      {...props}
      src={resolvedSrc}
      onError={(event) => {
        if (!usingFallback && fallbackSrc && fallbackSrc !== src) {
          setUsingFallback(true);
          return;
        }
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
