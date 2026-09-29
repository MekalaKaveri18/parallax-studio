"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  /** When set, the image is animated with the matching camera motion. */
  motionId?: string;
  duration?: number;
  intensity?: number;
  playing?: boolean;
  className?: string;
  style?: React.CSSProperties;
  imgClassName?: string;
  /** Ignore prefers-reduced-motion (e.g. user explicitly pressed play). */
  force?: boolean;
  loading?: "lazy" | "eager";
}

/**
 * The single renderer for stills and motion "videos". The frame clips an image
 * that the CSS motion engine (globals.css) moves like a camera would.
 */
export function MotionMedia({
  src,
  alt,
  motionId,
  duration = 5,
  intensity = 1,
  playing = true,
  className,
  style,
  imgClassName,
  force,
  loading = "lazy",
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className={cn("relative overflow-hidden bg-ink-800", className)} style={style}>
      {!loaded && !failed && <div className="shimmer absolute inset-0" />}
      {failed ? (
        <div className="brand-gradient absolute inset-0 opacity-30" aria-label={alt} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote placeholder + data URLs; next/image adds nothing here
        <img
          src={src}
          alt={alt}
          loading={loading}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={motionId ? ({ "--dur": `${duration}s`, "--k": intensity } as React.CSSProperties) : undefined}
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
            motionId && ["motion", `motion-${motionId}`, !playing && "paused", force && "force-motion"],
            imgClassName,
          )}
        />
      )}
    </div>
  );
}
