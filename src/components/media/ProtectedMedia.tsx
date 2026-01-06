"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Play, Lock, Eye } from "lucide-react";

interface ProtectedMediaProps {
  src: string;
  type: "image" | "video";
  alt?: string;
  className?: string;
  poster?: string;
  isLocked?: boolean;
  isBlurred?: boolean;
  onUnlockClick?: () => void;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
}

export default function ProtectedMedia({
  src,
  type,
  alt = "",
  className = "",
  poster,
  isLocked = false,
  isBlurred = false,
  onUnlockClick,
  autoPlay = false,
  muted = true,
  loop = false,
  controls = true,
}: ProtectedMediaProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Prevent context menu (right-click)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Prevent drag
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    return false;
  };

  // Prevent selection
  const handleSelectStart = (e: React.SyntheticEvent) => {
    e.preventDefault();
    return false;
  };

  // Handle video play/pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Disable keyboard shortcuts for saving
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent Ctrl+S, Ctrl+Shift+S
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  // Placeholder gradient for locked content - never expose real URL
  const lockedPlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23d4af37'/%3E%3Cstop offset='50%25' style='stop-color:%23b8860b'/%3E%3Cstop offset='100%25' style='stop-color:%23996515'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='400' height='400'/%3E%3C/svg%3E";

  if (isLocked) {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden select-none ${className}`}
        onContextMenu={handleContextMenu}
        onDragStart={handleDragStart}
      >
        {/* Secure placeholder - real URL is NEVER in DOM when locked */}
        <div className="absolute inset-0 blur-xl scale-110">
          <Image
            src={lockedPlaceholder}
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            draggable={false}
            unoptimized
          />
        </div>

        {/* Lock overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-10">
          <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <p className="text-white font-medium mb-2">Premium Content</p>
          {onUnlockClick && (
            <button
              onClick={onUnlockClick}
              className="px-6 py-2 bg-[var(--gold)] text-black font-semibold rounded-full hover:bg-[var(--gold-dark)] transition-colors"
            >
              Unlock
            </button>
          )}
        </div>

        {/* Protection overlay */}
        <div className="absolute inset-0 z-20 pointer-events-auto" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden select-none group ${className}`}
      onContextMenu={handleContextMenu}
      onDragStart={handleDragStart}
      onSelectCapture={handleSelectStart}
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
    >
      {type === "image" ? (
        <>
          <Image
            src={src}
            alt={alt || ""}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className={`object-cover pointer-events-none ${
              isBlurred ? "blur-lg" : ""
            }`}
            draggable={false}
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
          />
          {/* Transparent overlay to prevent direct access */}
          <div
            className="absolute inset-0 z-10"
            onContextMenu={handleContextMenu}
          />
        </>
      ) : (
        <>
          <video
            ref={videoRef}
            src={src}
            poster={poster}
            className={`w-full h-full object-cover ${isBlurred ? "blur-lg" : ""}`}
            playsInline
            autoPlay={autoPlay}
            muted={muted}
            loop={loop}
            controls={false}
            controlsList="nodownload noplaybackrate"
            disablePictureInPicture
            disableRemotePlayback
            onContextMenu={handleContextMenu}
            onDragStart={handleDragStart}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => setIsPlaying(false)}
            style={{
              WebkitUserDrag: 'none',
              userSelect: 'none',
            } as React.CSSProperties}
          />

          {/* Custom video controls overlay */}
          <div
            className="absolute inset-0 z-10 flex items-center justify-center"
            onClick={togglePlay}
            onContextMenu={handleContextMenu}
          >
            {!isPlaying && (
              <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-transform hover:scale-110">
                <Play className="w-8 h-8 text-white ml-1" fill="white" />
              </div>
            )}
          </div>

          {/* Video progress bar (basic) */}
          {controls && (
            <div
              className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity"
              onContextMenu={handleContextMenu}
            >
              <VideoControls videoRef={videoRef} isPlaying={isPlaying} onTogglePlay={togglePlay} />
            </div>
          )}
        </>
      )}

      {/* Watermark overlay (optional, can be enabled) */}
      {/* <div className="absolute inset-0 z-5 pointer-events-none opacity-10">
        <div className="w-full h-full flex items-center justify-center rotate-[-30deg]">
          <span className="text-white text-2xl font-bold">VipOnly</span>
        </div>
      </div> */}
    </div>
  );
}

// Custom video controls component
function VideoControls({
  videoRef,
  isPlaying,
  onTogglePlay,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  isPlaying: boolean;
  onTogglePlay: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      setProgress((video.currentTime / video.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, [videoRef]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    video.currentTime = percent * video.duration;
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
      {/* Play/Pause button */}
      <button
        onClick={onTogglePlay}
        className="text-white hover:text-[var(--gold)] transition-colors"
      >
        {isPlaying ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <Play className="w-5 h-5" fill="currentColor" />
        )}
      </button>

      {/* Progress bar */}
      <div
        className="flex-1 h-1 bg-white/30 rounded-full cursor-pointer group/progress"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-[var(--gold)] rounded-full relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover/progress:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Time */}
      <span className="text-white text-xs font-medium min-w-[70px] text-right">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      {/* Mute button */}
      <button
        onClick={toggleMute}
        className="text-white hover:text-[var(--gold)] transition-colors"
      >
        {isMuted ? (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
        )}
      </button>
    </div>
  );
}
