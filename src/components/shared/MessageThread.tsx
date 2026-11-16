import React from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { LeadMessage } from '../../types';

export type ThreadMessage = LeadMessage & {
  channel?: 'web' | 'whatsapp';
};

interface MessageThreadProps {
  messages?: ThreadMessage[];
  viewerRole: 'tourist' | 'provider';
  counterpartName: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  placeholder?: string;
  emptyText?: string;
  inputAriaLabel: string;
  compact?: boolean;
}

export const MessageThread: React.FC<MessageThreadProps> = ({
  messages = [],
  viewerRole,
  counterpartName,
  draft,
  onDraftChange,
  onSend,
  placeholder = 'Write a message...',
  emptyText = 'No messages yet. Start the conversation below.',
  inputAriaLabel,
  compact = false
}) => {
  return (
    <div
      className={`bg-[#FAF7F2] dark:bg-[#101914] border border-[#E8DFC9] dark:border-[#23352A] transition-colors ${
        compact ? 'mt-2 p-2.5 rounded-xl space-y-2' : 'mt-3 p-4 rounded-2xl space-y-3'
      }`}
    >
      <div
        className={`space-y-2 overflow-y-auto pr-0.5 ${
          compact ? 'max-h-40' : 'max-h-56'
        }`}
      >
        {messages.length === 0 ? (
          <p className={`${compact ? 'text-[11px]' : 'text-xs'} text-[#6B7A72] dark:text-[#8DA195] italic`}>
            {emptyText}
          </p>
        ) : (
          messages.map((m) => {
            const isOwn = m.sender === viewerRole;
            return (
              <div
                key={m.id}
                className={`rounded-xl ${
                  compact ? 'p-2 text-[11px] max-w-[88%]' : 'p-3 text-xs max-w-[85%] sm:max-w-sm'
                } ${
                  isOwn
                    ? 'bg-[#284435] dark:bg-emerald-800 text-white ml-auto shadow-2xs'
                    : 'bg-white dark:bg-[#152019] text-[#1F2A24] dark:text-[#EDF3EF] border border-[#E8DFC9] dark:border-[#23352A] mr-auto shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-[10px] opacity-80 mb-1">
                  <span className="font-semibold flex items-center gap-1 truncate">
                    <span>{isOwn ? 'You' : counterpartName}</span>
                    {m.channel === 'whatsapp' && (
                      <span
                        className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                          isOwn
                            ? 'bg-white/15 text-emerald-100'
                            : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        <MessageCircle className="w-2.5 h-2.5" />
                        <span>WhatsApp</span>
                      </span>
                    )}
                  </span>
                  <span className="shrink-0">{m.timestamp}</span>
                </div>
                <p className="leading-relaxed break-words whitespace-pre-wrap">{m.text}</p>
              </div>
            );
          })
        )}
      </div>

      <div
        className={`flex items-center gap-2 border-t border-[#E8DFC9] dark:border-[#23352A] ${
          compact ? 'pt-2' : 'pt-2.5'
        }`}
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder={placeholder}
          aria-label={inputAriaLabel}
          className={`flex-1 bg-white dark:bg-[#152019] text-[#1F2A24] dark:text-[#EDF3EF] rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500 ${
            compact ? 'min-h-[38px] px-2.5 py-1.5 text-[11px]' : 'min-h-[42px] px-3 py-2 text-xs'
          }`}
        />
        <button
          type="button"
          onClick={onSend}
          disabled={!draft.trim()}
          aria-label="Send message"
          className={`bg-[#284435] hover:bg-[#1E332A] dark:bg-emerald-800 dark:hover:bg-emerald-700 disabled:opacity-45 disabled:cursor-not-allowed text-white rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
            compact ? 'min-h-[38px] min-w-[38px] px-2.5 text-[11px]' : 'min-h-[42px] px-3.5 py-2 text-xs'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          {!compact && <span>Send</span>}
        </button>
      </div>
    </div>
  );
};
