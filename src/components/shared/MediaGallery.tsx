import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Play, X, Images } from 'lucide-react';
import type { ListingMedia } from '../../types';

/** Full-screen viewer: swipe or use arrow keys; Escape closes. */
const MediaViewer: React.FC<{ media: ListingMedia[]; start: number; title: string; onClose: () => void }> = ({
  media,
  start,
  title,
  onClose
}) => {
  const [index, setIndex] = useState(start);
  const touchX = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const go = useCallback((d: number) => setIndex((i) => (i + d + media.length) % media.length), [media.length]);

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close only the viewer, not the dialog underneath it.
        e.stopImmediatePropagation();
        onClose();
      } else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
      prevFocus?.focus?.();
    };
  }, [go, onClose]);

  const item = media[index];
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title}: photo ${index + 1} of ${media.length}`}
      className="fixed inset-0 z-[70] bg-black/95 flex flex-col"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 text-white">
        <p className="text-sm font-semibold truncate">{title}</p>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-white/70">
            {index + 1} / {media.length}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="relative flex-1 flex items-center justify-center px-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {item.kind === 'image' ? (
          <img src={item.url} alt={`${title}, photo ${index + 1}`} className="max-w-full max-h-full object-contain rounded-lg" />
        ) : (
          <video key={item.id} src={item.url} controls autoPlay playsInline className="max-w-full max-h-full rounded-lg bg-black" />
        )}
        {media.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white hidden sm:flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white hidden sm:flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};

/**
 * Swipeable strip of a package's photos and videos. Videos show a play badge and only load
 * when opened, so browsing stays light on mobile data.
 */
export const MediaGallery: React.FC<{ media?: ListingMedia[]; title: string; className?: string }> = ({ media, title, className = '' }) => {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  if (!media || media.length === 0) return null;

  return (
    <div className={className}>
      <div className="flex gap-2 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:thin]" aria-label={`${title}: photos and videos`}>
        {media.map((m, i) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`Open ${m.kind === 'image' ? 'photo' : 'video'} ${i + 1} of ${media.length}`}
            className={`relative shrink-0 snap-start overflow-hidden rounded-xl bg-[#1C2C24] cursor-pointer ${
              i === 0 ? 'w-64 h-40 sm:w-72 sm:h-44' : 'w-40 h-40 sm:h-44'
            }`}
          >
            {m.kind === 'image' ? (
              <img src={m.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-[#284435] to-[#0D1511]">
                <span className="w-12 h-12 rounded-full bg-white/90 text-[#1C2C24] flex items-center justify-center shadow-lg">
                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                </span>
              </span>
            )}
            {i === 0 && media.length > 1 && (
              <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/55 text-white text-[11px] font-bold">
                <Images className="w-3.5 h-3.5" /> {media.length}
              </span>
            )}
          </button>
        ))}
      </div>
      {open !== null && <MediaViewer media={media} start={open} title={title} onClose={close} />}
    </div>
  );
};

/** The package's cover photo URL, if it has one. */
export function coverPhoto(media?: ListingMedia[]): string | null {
  return media?.find((m) => m.kind === 'image')?.url ?? null;
}
