"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { loopMs, motionKeyframes, poseFilter, poseTransform, stillPose } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  /** When set, the image is animated with the matching camera motion. */
  motionId?: string;
  duration?: number;
  intensity?: number;
  playing?: boolean;
  /** When paused: "reset" returns to the clean still (hover tiles); "hold" freezes in place (player). */
  pauseMode?: "reset" | "hold";
  className?: string;
  style?: React.CSSProperties;
  imgClassName?: string;
  /** Ignore prefers-reduced-motion (e.g. user explicitly pressed play). */
  force?: boolean;
  loading?: "lazy" | "eager";
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/**
 * The single renderer for stills and motion "videos". The frame clips an image
 * that the motion engine (lib/motion.ts) moves like a camera would.
 */
export function MotionMedia({
  src,
  alt,
  motionId,
  duration = 5,
  intensity = 1,
  playing = true,
  pauseMode = "reset",
  className,
  style,
  imgClassName,
  force,
  loading = "lazy",
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const animRef = useRef<Animation | null>(null);

  const reduced = usePrefersReducedMotion();
  const active = Boolean(motionId) && (force || !reduced);

  // (Re)build the animation when the move changes; keep the playhead so
  // dragging intensity doesn't restart the shot.
  useEffect(() => {
    const el = imgRef.current;
    if (!el || !motionId || !active) {
      animRef.current?.cancel();
      animRef.current = null;
      return;
    }
    const prev = animRef.current;
    const time = prev?.currentTime ?? 0;
    const wasPaused = prev?.playState === "paused";
    prev?.cancel();
    const anim = el.animate(motionKeyframes(motionId, intensity, duration), {
      duration: loopMs(duration),
      iterations: Infinity,
      easing: "linear",
    });
    anim.currentTime = time;
    if (wasPaused) anim.pause();
    animRef.current = anim;
  }, [motionId, intensity, duration, active]);

  useEffect(() => () => animRef.current?.cancel(), []);

  // Play / pause.
  useEffect(() => {
    const anim = animRef.current;
    if (!anim) return;
    if (playing) anim.play();
    else if (pauseMode === "hold") anim.pause();
    // Cancel (not pause) so the inline resting frame shows instead of keyframe 0.
    else anim.cancel();
  }, [playing, pauseMode, motionId, intensity, duration, active]);

  // Resting frame: shown before playback starts, when paused-reset, or with reduced motion.
  const rest = motionId ? stillPose(motionId, intensity, duration) : null;
  const showRest = rest && (!active || (!playing && pauseMode === "reset"));

  return (
    <div className={cn("relative overflow-hidden bg-ink-800", className)} style={style}>
      {!loaded && !failed && <div className="shimmer absolute inset-0" />}
      {failed ? (
        <div className="brand-gradient absolute inset-0 opacity-30" aria-label={alt} />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- remote placeholder + data URLs; next/image adds nothing here
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          draggable={false}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          style={
            rest
              ? {
                  transformOrigin: "center",
                  willChange: "transform, filter",
                  transform: poseTransform(rest),
                  filter: showRest ? poseFilter(rest) : undefined,
                }
              : undefined
          }
          className={cn(
            "absolute inset-0 size-full object-cover transition-opacity duration-500",
            loaded ? "opacity-100" : "opacity-0",
            imgClassName,
          )}
        />
      )}
    </div>
  );
}
