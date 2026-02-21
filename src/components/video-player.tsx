import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  className?: string;
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getEffectiveDuration(video: HTMLVideoElement): number {
  if (Number.isFinite(video.duration) && video.duration > 0) return video.duration;
  if (video.seekable.length > 0) {
    const end = video.seekable.end(video.seekable.length - 1);
    if (Number.isFinite(end) && end > 0) return end;
  }
  return 0;
}

export function VideoPlayer({ src, poster, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);
  const wasPlayingBeforeScrubRef = useRef(false);
  const pauseOverlayTimeoutRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [showPausedOverlay, setShowPausedOverlay] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [hoverTime, setHoverTime] = useState(0);

  // Click on the video: first click unmutes; subsequent clicks toggle play/pause
  const handleVideoClick = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      setIsMuted(false);
      if (v.paused) v.play();
      return;
    }
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  }, []);

  const togglePlay = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
    } else {
      v.pause();
    }
  }, []);

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const handleTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    const effectiveDuration = getEffectiveDuration(v);
    if (effectiveDuration !== duration) {
      setDuration(effectiveDuration);
    }
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
  }, [duration]);

  const syncDurationFromVideo = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(getEffectiveDuration(v));
  }, []);

  const seekFromClientX = useCallback(
    (clientX: number) => {
      const v = videoRef.current;
      const bar = progressRef.current;
      if (!v || !bar) return;
      const effectiveDuration = getEffectiveDuration(v);
      if (effectiveDuration <= 0) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      v.currentTime = pct * effectiveDuration;
      setCurrentTime(v.currentTime);
      setDuration(effectiveDuration);
      setHoverPct(pct);
      setHoverTime(v.currentTime);
    },
    [],
  );

  const handleProgressMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressRef.current;
      if (!bar) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      setHoverPct(pct);
      setHoverTime(pct * duration);
    },
    [duration],
  );

  const handleProgressPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const v = videoRef.current;
      if (!v) return;
      const effectiveDuration = getEffectiveDuration(v);
      if (effectiveDuration <= 0) return;
      isScrubbingRef.current = true;
      wasPlayingBeforeScrubRef.current = !v.paused;
      v.pause();
      e.currentTarget.setPointerCapture(e.pointerId);
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const handleProgressPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbingRef.current) return;
      seekFromClientX(e.clientX);
    },
    [seekFromClientX],
  );

  const handleProgressPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isScrubbingRef.current) return;
      isScrubbingRef.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
      const v = videoRef.current;
      if (v && wasPlayingBeforeScrubRef.current) {
        void v.play();
      }
    },
    [],
  );

  const toggleFullscreen = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  useEffect(() => {
    if (pauseOverlayTimeoutRef.current !== null) {
      window.clearTimeout(pauseOverlayTimeoutRef.current);
      pauseOverlayTimeoutRef.current = null;
    }

    if (isPlaying) {
      setShowPausedOverlay(false);
      return;
    }

    pauseOverlayTimeoutRef.current = window.setTimeout(() => {
      setShowPausedOverlay(true);
      pauseOverlayTimeoutRef.current = null;
    }, 5000);

    return () => {
      if (pauseOverlayTimeoutRef.current !== null) {
        window.clearTimeout(pauseOverlayTimeoutRef.current);
        pauseOverlayTimeoutRef.current = null;
      }
    };
  }, [isPlaying]);

  const playPct =
    duration > 0 ? Math.max(0, Math.min(100, (currentTime / duration) * 100)) : 0;
  const bufferPct =
    duration > 0 ? Math.max(0, Math.min(100, (buffered / duration) * 100)) : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        "group/video relative aspect-video w-full overflow-hidden rounded-[inherit]",
        className,
      )}
    >
      {/* Paused overlay with thumbnail + big play button */}
      <div
        className={cn(
          "absolute inset-0 z-10 flex items-center justify-center transition-opacity duration-300",
          showPausedOverlay
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={handleVideoClick}
      >
        {poster && (
          <img
            src={poster}
            alt="Video thumbnail"
            className="size-full object-cover"
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-white/30 backdrop-blur transition duration-200 hover:bg-white/40">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="size-5 translate-x-0.5 text-white"
            >
              <path
                d="M2.2 2.863C2.2 1.612 3.572.845 4.638 1.5l8.347 5.137c1.016.625 1.016 2.1 0 2.726L4.638 14.5C3.572 15.155 2.2 14.388 2.2 13.137V2.863Z"
                fill="currentColor"
              />
            </svg>
          </div>
        </div>
      </div>

      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        tabIndex={0}
        className="h-full w-full cursor-pointer bg-black object-cover"
        onClick={handleVideoClick}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={syncDurationFromVideo}
        onDurationChange={syncDurationFromVideo}
        onLoadedData={syncDurationFromVideo}
        onCanPlay={syncDurationFromVideo}
      />

      {/* Bottom gradient + controls — visible on hover */}
      <div
        className={cn(
          "absolute right-0 bottom-0 left-0 bg-gradient-to-t from-black/35 to-transparent px-4 pt-10 pb-3 transition duration-150 ease-in will-change-transform",
          isMuted
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none translate-y-2 opacity-0 group-hover/video:pointer-events-auto group-hover/video:translate-y-0 group-hover/video:opacity-100 group-hover/video:duration-200 group-hover/video:ease-out",
        )}
      >
        <div className="flex items-center gap-0.5">
          {/* Play / Pause */}
          <button
            tabIndex={-1}
            aria-label={isPlaying ? "Pause" : "Play"}
            onClick={togglePlay}
            className="relative flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md p-2 text-white outline-hidden transition duration-100 hover:bg-white/20 hover:backdrop-blur-sm focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isPlaying ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="size-4"
              >
                <path
                  d="M2.2 2.5C2.2 2.22 2.42 2 2.7 2h2.5c.28 0 .5.22.5.5v11c0 .28-.22.5-.5.5H2.7c-.28 0-.5-.22-.5-.5V2.5ZM10.2 2.5c0-.28.22-.5.5-.5h2.5c.28 0 .5.22.5.5v11c0 .28-.22.5-.5.5h-2.5c-.28 0-.5-.22-.5-.5V2.5Z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="size-4"
              >
                <path
                  d="M2.2 2.863C2.2 1.612 3.572.845 4.638 1.5l8.347 5.137c1.016.625 1.016 2.1 0 2.726L4.638 14.5C3.572 15.155 2.2 14.388 2.2 13.137V2.863Z"
                  fill="currentColor"
                />
              </svg>
            )}
          </button>

          {/* Mute / Unmute */}
          <button
            tabIndex={-1}
            aria-label={isMuted ? "Unmute" : "Mute"}
            onClick={toggleMute}
            className="relative flex h-10 min-w-10 cursor-pointer items-center justify-center rounded-md p-2.5 text-white outline-hidden transition duration-100 hover:bg-white/20 hover:backdrop-blur-sm focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isMuted ? (
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M9.635 5.366 6.468 8.53c-.173.173-.26.26-.36.322a1 1 0 0 1-.29.12C5.704 9 5.582 9 5.337 9H3.6c-.56 0-.84 0-1.054.109a1 1 0 0 0-.437.437C2 9.76 2 10.04 2 10.6v2.8c0 .56 0 .84.109 1.054a1 1 0 0 0 .437.437C2.76 15 3.04 15 3.6 15h1.737c.245 0 .367 0 .482.028a1 1 0 0 1 .29.12c.1.061.187.148.36.32l3.165 3.166c.429.429.643.643.827.657a.5.5 0 0 0 .42-.174c.119-.14.119-.443.119-1.048V5.93c0-.606 0-.908-.12-1.049a.5.5 0 0 0-.42-.173c-.183.014-.397.228-.826.657Z" />
                <line x1="22" y1="2" x2="2" y2="22" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M19.748 5A11.946 11.946 0 0 1 22 12c0 2.612-.835 5.03-2.252 7M15.745 8A6.968 6.968 0 0 1 17 12a6.967 6.967 0 0 1-1.255 4M9.635 5.366 6.468 8.53c-.173.173-.26.26-.36.322a1 1 0 0 1-.29.12C5.704 9 5.582 9 5.337 9H3.6c-.56 0-.84 0-1.054.109a1 1 0 0 0-.437.437C2 9.76 2 10.04 2 10.6v2.8c0 .56 0 .84.109 1.054a1 1 0 0 0 .437.437C2.76 15 3.04 15 3.6 15h1.737c.245 0 .367 0 .482.028a1 1 0 0 1 .29.12c.1.061.187.148.36.32l3.165 3.166c.429.429.643.643.827.657a.5.5 0 0 0 .42-.174c.119-.14.119-.443.119-1.048V5.93c0-.606 0-.908-.12-1.049a.5.5 0 0 0-.42-.173c-.183.014-.397.228-.826.657Z" />
              </svg>
            )}
          </button>

          {/* Time + progress bar */}
          <div className="flex min-w-0 flex-1 items-center gap-2 px-2">
            <span className="pointer-events-none text-xs font-semibold text-white tabular-nums">
              {formatTime(currentTime)}
            </span>

            <div
              ref={progressRef}
              className="group/progress -my-8 flex-1 cursor-pointer py-8"
              style={{ touchAction: "none" }}
              onMouseMove={handleProgressMouseMove}
              onMouseLeave={() => setHoverPct(null)}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={handleProgressPointerDown}
              onPointerMove={handleProgressPointerMove}
              onPointerUp={handleProgressPointerUp}
              onPointerCancel={handleProgressPointerUp}
            >
              <div className="relative h-1.5 rounded-full bg-white/30">
                {/* Buffer */}
                <div
                  className="pointer-events-none absolute h-full min-w-[2px] rounded-full bg-white/50"
                  style={{ width: `${bufferPct}%` }}
                />
                {/* Playback */}
                <div
                  className="pointer-events-none absolute h-full min-w-[2px] rounded-full bg-white"
                  style={{ width: `${playPct}%` }}
                />
                {/* Hover scrub indicator */}
                {hoverPct !== null && (
                  <>
                    <div
                      className="pointer-events-none absolute top-1/2 h-8 w-px -translate-y-1/2 bg-white/40 opacity-0 transition duration-100 group-hover/progress:opacity-100"
                      style={{ left: `${hoverPct * 100}%` }}
                    />
                    <div
                      className="pointer-events-none absolute bottom-5 -translate-x-1/2 text-xs font-semibold text-white opacity-0 transition duration-100 group-hover/progress:opacity-100"
                      style={{ left: `${hoverPct * 100}%` }}
                    >
                      {formatTime(hoverTime)}
                    </div>
                  </>
                )}
              </div>
            </div>

            <span className="pointer-events-none text-xs font-semibold text-white tabular-nums">
              -{formatTime(duration - currentTime)}
            </span>
          </div>

          {/* Fullscreen */}
          <button
            tabIndex={-1}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            onClick={toggleFullscreen}
            className="flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md p-2 text-white outline-hidden transition duration-100 hover:bg-white/20 hover:backdrop-blur-sm focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {isFullscreen ? (
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="m14 10 7-7m0 0h-6m6 0v6m-11 5-7 7m0 0h6m-6 0v-6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
