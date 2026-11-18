import React, { useRef, useState } from 'react';
import { ImagePlus, Star, Trash2, Loader2, Film, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { ListingPackage, ListingMedia } from '../../types';

const MAX_PHOTO_EDGE = 1920;
const MAX_VIDEO_MB = 40;
const MAX_PHOTOS = 12;
const MAX_VIDEOS = 3;

/**
 * Re-draws a photo on a canvas at most 1920px wide/tall as JPEG. This keeps uploads small on
 * slow mobile data and drops the file's metadata, including the GPS location phones embed.
 * Returns null when the browser cannot decode the file.
 */
async function preparePhoto(file: File): Promise<Blob | null> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    const scale = Math.min(1, MAX_PHOTO_EDGE / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return await new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85));
  } catch {
    return null;
  }
}

function upload(
  listingId: number,
  body: Blob,
  contentType: string,
  onProgress: (fraction: number) => void
): Promise<{ ok: boolean; data: any }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/listings/${listingId}/media`);
    xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('tanexpo_auth_token') || ''}`);
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      let data: any = {};
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        data = {};
      }
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
    };
    xhr.onerror = () => resolve({ ok: false, data: { error: 'Network problem. Check your connection and try again.' } });
    xhr.send(body);
  });
}

interface Pending {
  key: string;
  name: string;
  progress: number;
  kind: 'image' | 'video';
}

export const ListingMediaManager: React.FC<{ listing: ListingPackage }> = ({ listing }) => {
  const { replaceListing } = useApp();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const media: ListingMedia[] = listing.media || [];
  const photos = media.filter((m) => m.kind === 'image').length;
  const videos = media.filter((m) => m.kind === 'video').length;

  const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('tanexpo_auth_token') || ''}` });

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    setErrors([]);
    let photoSlots = MAX_PHOTOS - photos;
    let videoSlots = MAX_VIDEOS - videos;
    const problems: string[] = [];
    // One at a time: kinder to slow connections and keeps progress readable.
    for (const file of Array.from(files)) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) {
        problems.push(`${file.name}: not a photo or video.`);
        continue;
      }
      if (isImage && photoSlots <= 0) {
        problems.push(`${file.name}: a package can have at most ${MAX_PHOTOS} photos.`);
        continue;
      }
      if (isVideo && videoSlots <= 0) {
        problems.push(`${file.name}: a package can have at most ${MAX_VIDEOS} videos.`);
        continue;
      }
      if (isVideo && file.size > MAX_VIDEO_MB * 1024 * 1024) {
        problems.push(`${file.name}: videos can be at most ${MAX_VIDEO_MB} MB. Trim it or record a shorter clip.`);
        continue;
      }

      let body: Blob = file;
      let contentType = file.type || 'application/octet-stream';
      if (isImage) {
        const prepared = await preparePhoto(file);
        if (prepared) {
          body = prepared;
          contentType = 'image/jpeg';
        } else if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
          problems.push(`${file.name}: this photo format can't be read. Use a JPEG or PNG.`);
          continue;
        }
      }

      const key = `${file.name}-${Date.now()}-${Math.random()}`;
      setPending((p) => [...p, { key, name: file.name, progress: 0, kind: isVideo ? 'video' : 'image' }]);
      const result = await upload(listing.id, body, contentType, (fraction) =>
        setPending((p) => p.map((x) => (x.key === key ? { ...x, progress: fraction } : x)))
      );
      setPending((p) => p.filter((x) => x.key !== key));
      if (result.ok && result.data.listing) {
        replaceListing(result.data.listing);
        listing = result.data.listing;
        if (isVideo) videoSlots -= 1;
        else photoSlots -= 1;
      } else {
        problems.push(`${file.name}: ${result.data.error || 'upload failed.'}`);
      }
    }
    setErrors(problems);
    if (inputRef.current) inputRef.current.value = '';
  };

  const remove = async (item: ListingMedia) => {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/listings/${listing.id}/media/${item.id}`, { method: 'DELETE', headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.listing) replaceListing(data.listing);
      else setErrors([data.error || 'Could not remove it.']);
    } finally {
      setBusyId(null);
    }
  };

  const makeCover = async (item: ListingMedia) => {
    setBusyId(item.id);
    try {
      const res = await fetch(`/api/listings/${listing.id}/media/${item.id}/cover`, { method: 'PUT', headers: authHeaders() });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.listing) replaceListing(data.listing);
    } finally {
      setBusyId(null);
    }
  };

  const coverId = media.find((m) => m.kind === 'image')?.id;

  return (
    <section className="space-y-3" aria-label="Photos and videos">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#284435] dark:text-[#EDF3EF]">Photos & videos</h3>
          <p className="text-xs text-[#6B7A72] dark:text-[#8DA195]">
            Travelers book what they can see. Add your vehicles, camps and real trips. {photos}/{MAX_PHOTOS} photos · {videos}/{MAX_VIDEOS} videos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {media.map((m) => (
          <div key={m.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#1C2C24] group">
            {m.kind === 'image' ? (
              <img src={m.url} alt="" className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <>
                <video src={`${m.url}#t=0.5`} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                <span className="absolute left-1.5 bottom-1.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                  <Film className="w-3 h-3" /> Video
                </span>
              </>
            )}
            {m.id === coverId && (
              <span className="absolute left-1.5 top-1.5 px-1.5 py-0.5 rounded-md bg-[#E8B94A] text-[#1C2C24] text-[10px] font-bold">Cover</span>
            )}
            <div className="absolute right-1 top-1 flex flex-col gap-1">
              {m.kind === 'image' && m.id !== coverId && (
                <button
                  type="button"
                  disabled={busyId === m.id}
                  onClick={() => void makeCover(m)}
                  aria-label="Use as cover photo"
                  title="Use as cover"
                  className="w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
                >
                  <Star className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                disabled={busyId === m.id}
                onClick={() => void remove(m)}
                aria-label={m.kind === 'image' ? 'Remove photo' : 'Remove video'}
                className="w-9 h-9 rounded-full bg-black/55 text-white flex items-center justify-center cursor-pointer disabled:opacity-50"
              >
                {busyId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}

        {pending.map((p) => (
          <div key={p.key} className="relative aspect-square rounded-xl overflow-hidden bg-[#F3EEE4] dark:bg-[#1A2820] flex flex-col items-center justify-center gap-2 p-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#284435] dark:text-emerald-400" />
            <span className="text-[10px] font-bold text-[#284435] dark:text-[#EDF3EF]">{Math.round(p.progress * 100)}%</span>
            <span className="absolute inset-x-2 bottom-2 h-1.5 rounded-full bg-black/10 overflow-hidden">
              <span className="block h-full bg-[#D97843]" style={{ width: `${Math.round(p.progress * 100)}%` }} />
            </span>
          </div>
        ))}

        {(photos < MAX_PHOTOS || videos < MAX_VIDEOS) && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-[#D9CEBF] dark:border-[#2E4537] text-[#284435] dark:text-[#EDF3EF] flex flex-col items-center justify-center gap-1.5 text-xs font-bold hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] cursor-pointer"
          >
            <ImagePlus className="w-6 h-6" />
            Add photos or videos
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,video/mp4,video/webm,video/quicktime"
        multiple
        className="sr-only"
        aria-label="Choose photos or videos"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      <p className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
        Photos are resized on your phone before upload and their location data is removed. Videos: MP4 works on every phone, up to {MAX_VIDEO_MB} MB; keep them under a minute.
      </p>

      {errors.length > 0 && (
        <ul role="alert" className="space-y-1 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-800 dark:text-red-300">
          {errors.map((e) => (
            <li key={e} className="flex gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {e}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
