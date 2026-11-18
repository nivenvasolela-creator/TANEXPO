import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';

interface Credit {
  title: string;
  author: string;
  licence: string;
  licenceUrl: string;
  source: string;
}

/** Lists the photographer, licence and source of every hosted photo (required by their licences). */
export const PhotoCreditsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const ref = useModalAccessibility(true, onClose);
  const [credits, setCredits] = useState<Array<[string, Credit]> | null>(null);

  useEffect(() => {
    fetch('/photos/credits.json')
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => setCredits(Object.entries(data as Record<string, Credit>)))
      .catch(() => setCredits([]));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-credits-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[85vh] flex flex-col bg-[#FAF7F2] dark:bg-[#101914] rounded-t-3xl sm:rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-2xl focus:outline-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-[#E8DFC9] dark:border-[#23352A]">
          <div>
            <h2 id="photo-credits-title" className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">Photo credits</h2>
            <p className="text-sm text-[#6B7A72] dark:text-[#8DA195]">Photos from Wikimedia Commons, used under the licences shown.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B7A72] hover:bg-[#EDE5D5] dark:hover:bg-[#1A2820] cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        <ul className="overflow-y-auto px-5 py-3 space-y-3 text-sm">
          {credits === null && <li className="text-[#6B7A72]">Loading…</li>}
          {credits?.map(([slot, c]) => (
            <li key={slot} className="flex gap-3 items-start">
              <img src={`/photos/${slot}-640.webp`} alt="" className="w-20 h-14 object-cover rounded-lg shrink-0 bg-[#284435]" loading="lazy" />
              <div className="min-w-0 text-[#1F2A24] dark:text-[#EDF3EF]">
                <a href={c.source} target="_blank" rel="noopener noreferrer" className="font-semibold underline break-words">{c.title}</a>
                <p className="text-xs text-[#6B7A72] dark:text-[#8DA195] break-words">
                  {c.author} ·{' '}
                  {c.licenceUrl ? (
                    <a href={c.licenceUrl} target="_blank" rel="noopener noreferrer" className="underline">{c.licence}</a>
                  ) : (
                    c.licence
                  )}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
