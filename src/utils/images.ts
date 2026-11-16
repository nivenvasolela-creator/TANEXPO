import type React from 'react';

/**
 * Photos are served by an image CDN that resizes on request. Asking for the size the screen
 * actually needs keeps pages light on slow mobile data and sharp on high-density displays.
 */
function sized(url: string, width: number): string {
  if (!url.includes('images.unsplash.com')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('auto', 'format');
    u.searchParams.set('fit', 'crop');
    u.searchParams.set('w', String(width));
    u.searchParams.set('q', width <= 200 ? '60' : '70');
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Props for a responsive <img>: the browser picks the smallest file that fills the slot.
 * `sizes` describes how wide the image is drawn at each breakpoint (standard `sizes` syntax).
 * A photo that fails to load is hidden so the coloured backdrop behind it shows instead of a
 * broken-image icon.
 */
export function photoProps(
  url: string,
  sizes: string,
  widths: number[] = [400, 640, 960, 1280]
): React.ImgHTMLAttributes<HTMLImageElement> {
  const resizable = url.includes('images.unsplash.com');
  return {
    src: sized(url, widths[Math.min(1, widths.length - 1)]),
    ...(resizable ? { srcSet: widths.map((w) => `${sized(url, w)} ${w}w`).join(', '), sizes } : {}),
    decoding: 'async',
    referrerPolicy: 'no-referrer',
    onError: (e: React.SyntheticEvent<HTMLImageElement>) => {
      e.currentTarget.style.display = 'none';
    }
  };
}

export const PHOTO_SIZES = {
  thumb: '64px',
  card: '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
  hero: '(min-width: 1024px) 960px, 100vw',
  heroTile: '360px'
};
