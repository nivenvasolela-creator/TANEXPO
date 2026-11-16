import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MessageCircle, PauseCircle, PlayCircle, Send, Forward, Unlink, CheckCheck } from 'lucide-react';

interface WaStatus {
  whatsappEnabled: boolean;
  simulator: boolean;
  available: boolean;
  linked: boolean;
  maskedNumber: string | null;
  optIn: boolean;
  paused: boolean;
  language: 'en' | 'sw';
  pendingOtp: { maskedPhone: string; expiresAt: string } | null;
}

interface WaMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  createdAt: string;
}

const SAMPLE_CUSTOMER_MESSAGE =
  'Hello, my name is Sarah Jensen. We are 4 people and would like a 5 day safari to Serengeti and Ngorongoro starting 14 February. Our budget is about USD 5000. Can you send a price?';

const card =
  'bg-white dark:bg-[#152019] rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs transition-colors';
const subtle = 'text-[#6B7A72] dark:text-[#8DA195]';
const strong = 'text-[#284435] dark:text-[#EDF3EF]';
const inputCls =
  'min-h-[44px] px-3 py-2 text-sm rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden focus:border-[#284435] dark:focus:border-emerald-500';
const primaryBtn =
  'min-h-[44px] px-5 py-2 rounded-xl bg-[#284435] dark:bg-emerald-800 hover:bg-[#1E332A] dark:hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-bold cursor-pointer';
const ghostBtn =
  'min-h-[44px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#152019] hover:bg-[#EDE5D5] dark:hover:bg-[#1A2820] text-[#284435] dark:text-[#EDF3EF] border border-[#E8DFC9] dark:border-[#23352A] text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50';

export const WhatsAppTab: React.FC = () => {
  const { activeProviderId, providers, refreshData } = useApp();
  const provider = providers.find((p) => p.id === activeProviderId);

  const [status, setStatus] = useState<WaStatus | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [messages, setMessages] = useState<WaMessage[]>([]);
  const [draft, setDraft] = useState('');
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const api = useCallback(async (path: string, method = 'GET', body?: unknown) => {
    const token = localStorage.getItem('tanexpo_auth_token') || '';
    const res = await fetch(`/api/whatsapp${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {})
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      const { ok, data } = await api('/status');
      if (ok) {
        setStatus(data);
        setLoadFailed(false);
      } else {
        setLoadFailed(true);
      }
    } catch {
      setLoadFailed(true);
    }
  }, [api]);

  const showPreview = Boolean(status?.simulator && (status.linked || status.pendingOtp));

  const loadThread = useCallback(async () => {
    try {
      const { ok, data } = await api('/thread');
      if (ok && Array.isArray(data.messages)) {
        setMessages((prev) =>
          prev.length === data.messages.length && prev[prev.length - 1]?.id === data.messages[data.messages.length - 1]?.id
            ? prev
            : data.messages
        );
      }
    } catch {
      // The next poll retries.
    }
  }, [api]);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus, activeProviderId]);

  useEffect(() => {
    if (!showPreview) return;
    void loadThread();
    const id = setInterval(() => void loadThread(), 4000);
    return () => clearInterval(id);
  }, [showPreview, loadThread]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const run = async (fn: () => Promise<void>) => {
    setNotice(null);
    setBusy(true);
    try {
      await fn();
    } catch {
      setNotice({ type: 'err', text: 'Network problem. Check your connection and try again.' });
    } finally {
      setBusy(false);
    }
  };

  const requestCode = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const { ok, data } = await api('/link/request', 'POST', { phone: phoneInput });
      if (!ok) {
        setNotice({ type: 'err', text: data.error || 'Could not send the code' });
        return;
      }
      setNotice({
        type: 'ok',
        text: data.simulatedOtp
          ? `Preview mode: the code for ${data.maskedPhone} appears in the chat below.`
          : `We sent a 6-digit code on WhatsApp to ${data.maskedPhone}.`
      });
      await loadStatus();
      await loadThread();
    });
  };

  const verifyCode = () =>
    void run(async () => {
      const { ok, data } = await api('/link/verify', 'POST', { code: codeInput });
      if (!ok) {
        setNotice({ type: 'err', text: data.error || 'That code is not correct' });
        return;
      }
      setCodeInput('');
      setNotice({ type: 'ok', text: `WhatsApp connected (${data.maskedNumber}).` });
      await loadStatus();
      await loadThread();
    });

  const updateSettings = (patch: { paused?: boolean; language?: 'en' | 'sw' }) =>
    void run(async () => {
      const { ok, data } = await api('/settings', 'PUT', patch);
      if (!ok) {
        setNotice({ type: 'err', text: data.error || 'Could not save' });
        return;
      }
      await loadStatus();
    });

  const unlink = () =>
    void run(async () => {
      const { ok } = await api('/link/unlink', 'POST');
      if (ok) {
        setMessages([]);
        setNotice({ type: 'ok', text: 'WhatsApp number unlinked.' });
        await loadStatus();
      }
    });

  const sendPreview = (body: string, forwarded = false) => {
    const text = body.trim();
    if (!text) return;
    void run(async () => {
      const { ok, data } = await api('/simulate-inbound', 'POST', { body: text, forwarded });
      if (!ok) {
        setNotice({ type: 'err', text: data.error || 'Could not send' });
        return;
      }
      setDraft('');
      await loadThread();
      await loadStatus();
      // Leads created or changed over WhatsApp show up in the pipeline straight away.
      await refreshData();
    });
  };

  if (!provider) return null;

  const statusPill = status?.linked
    ? status.paused
      ? { text: `Paused · ${status.maskedNumber}`, cls: 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800' }
      : { text: `Connected · ${status.maskedNumber}`, cls: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' }
    : { text: 'Not connected', cls: `bg-[#FAF7F2] dark:bg-[#101914] ${subtle} border-[#E8DFC9] dark:border-[#23352A]` };

  return (
    <div className="space-y-5">
      <div className={`${card} p-5 sm:p-7 space-y-5`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`font-serif text-xl font-bold ${strong}`}>Run TANEXPO from WhatsApp</h2>
              <p className={`text-sm ${subtle} mt-0.5`}>
                New requests reach you on WhatsApp. Reply with a short command, or forward a customer's message to save it.
              </p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusPill.cls}`}>{statusPill.text}</span>
        </div>

        {notice && (
          <div
            role="status"
            className={`p-3 rounded-xl text-sm border ${
              notice.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {notice.text}
          </div>
        )}

        {loadFailed && !status && (
          <p className={`text-sm ${subtle}`}>Could not load your WhatsApp settings. Check your connection and reopen this tab.</p>
        )}

        {status && !status.available && !status.linked && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-sm text-amber-900 dark:text-amber-200">
            WhatsApp alerts are not switched on for this TANEXPO site yet. Your requests still arrive in the Leads tab.
          </div>
        )}

        {status && status.linked && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#101914] border border-[#E8DFC9] dark:border-[#23352A]">
            <p className={`text-sm ${subtle}`}>
              {status.paused ? 'Alerts are paused. Requests still arrive in the Leads tab.' : 'You get a WhatsApp message for every new request.'}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-xl border border-[#E8DFC9] dark:border-[#23352A] overflow-hidden" role="group" aria-label="WhatsApp message language">
                {(['en', 'sw'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    disabled={busy}
                    aria-pressed={status.language === lang}
                    onClick={() => updateSettings({ language: lang })}
                    className={`min-h-[44px] px-3.5 text-xs font-bold cursor-pointer ${
                      status.language === lang
                        ? 'bg-[#284435] dark:bg-emerald-800 text-white'
                        : `bg-white dark:bg-[#152019] ${strong}`
                    }`}
                  >
                    {lang === 'en' ? 'English' : 'Kiswahili'}
                  </button>
                ))}
              </div>
              <button type="button" disabled={busy} onClick={() => updateSettings({ paused: !status.paused })} className={ghostBtn}>
                {status.paused ? <PlayCircle className="w-4 h-4 text-emerald-600" /> : <PauseCircle className="w-4 h-4 text-amber-600" />}
                <span>{status.paused ? 'Resume alerts' : 'Pause alerts'}</span>
              </button>
              <button type="button" disabled={busy} onClick={unlink} className={`${ghostBtn} !text-red-700 dark:!text-red-400`}>
                <Unlink className="w-3.5 h-3.5" />
                <span>Unlink</span>
              </button>
            </div>
          </div>
        )}

        {status && status.available && !status.linked && (
          <div className="space-y-4">
            <form onSubmit={requestCode} className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 flex flex-col gap-1.5">
                <span className={`text-xs font-bold ${strong}`}>Your WhatsApp number</span>
                <input
                  type="tel"
                  required
                  autoComplete="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="+255 7XX XXX XXX"
                  className={inputCls}
                />
              </label>
              <button type="submit" disabled={busy} className={`${primaryBtn} sm:self-end shrink-0`}>
                Send code
              </button>
            </form>

            {status.pendingOtp && (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#101914] border border-[#E8DFC9] dark:border-[#23352A] space-y-3">
                <p className={`text-sm ${subtle}`}>
                  Enter the 6-digit code we sent to {status.pendingOtp.maskedPhone}.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="6-digit code"
                    aria-label="6-digit WhatsApp verification code"
                    className={`${inputCls} w-40 font-mono tracking-widest`}
                  />
                  <button type="button" disabled={busy || codeInput.length !== 6} onClick={verifyCode} className={primaryBtn}>
                    Connect
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showPreview && (
        <div className={`${card} overflow-hidden`}>
          <div className="px-5 py-3.5 flex flex-wrap items-center justify-between gap-2 bg-[#075E54] text-white">
            <div>
              <p className="text-sm font-bold">TANEXPO</p>
              <p className="text-[11px] text-white/75">Preview of your WhatsApp chat with TANEXPO</p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-white/15 text-[11px] font-semibold">Preview · no real messages are sent</span>
          </div>

          <div
            className="h-[420px] overflow-y-auto px-3 py-4 space-y-2 bg-[#ECE5DD] dark:bg-[#0B1410]"
            aria-live="polite"
            aria-label="WhatsApp preview messages"
          >
            {messages.length === 0 && (
              <p className={`text-center text-xs ${subtle} mt-10`}>Messages between you and TANEXPO appear here.</p>
            )}
            {messages.map((m) => {
              const mine = m.direction === 'inbound';
              return (
                <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-2xl text-[13px] leading-snug whitespace-pre-wrap break-words shadow-xs ${
                      mine
                        ? 'bg-[#DCF8C6] dark:bg-[#1F4D3A] text-[#1F2A24] dark:text-[#EDF3EF] rounded-br-sm'
                        : 'bg-white dark:bg-[#1A2820] text-[#1F2A24] dark:text-[#EDF3EF] rounded-bl-sm'
                    }`}
                  >
                    {m.body}
                    <span className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${subtle}`}>
                      {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {mine && <CheckCheck className="w-3 h-3" />}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={threadEndRef} />
          </div>

          {status?.linked && (
            <div className="p-3 space-y-2.5 border-t border-[#E8DFC9] dark:border-[#23352A]">
              <div className="flex gap-2 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => sendPreview(SAMPLE_CUSTOMER_MESSAGE, true)}
                  className="shrink-0 min-h-[40px] px-3 rounded-full bg-[#D97843] hover:bg-[#C26735] disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Forward className="w-3.5 h-3.5" />
                  Forward a sample customer message
                </button>
                {(status.language === 'sw' ? ['MAOMBI', 'MUHTASARI', 'MSAADA'] : ['LEADS', 'DIGEST', 'HELP']).map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    disabled={busy}
                    onClick={() => sendPreview(cmd)}
                    className={`shrink-0 min-h-[40px] px-3.5 rounded-full border border-[#E8DFC9] dark:border-[#23352A] bg-[#FAF7F2] dark:bg-[#101914] text-xs font-bold font-mono cursor-pointer disabled:opacity-50 ${strong}`}
                  >
                    {cmd}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  sendPreview(draft);
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a command, or paste a customer's message"
                  aria-label="Message to TANEXPO"
                  className={`${inputCls} flex-1 min-w-0`}
                />
                <button type="submit" disabled={busy || !draft.trim()} aria-label="Send" className={`${primaryBtn} !px-3.5`}>
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      <div className={`${card} p-5 sm:p-7 grid gap-5 sm:grid-cols-2`}>
        <div className="space-y-2">
          <h3 className={`text-sm font-bold ${strong}`}>How it works</h3>
          <ol className={`text-sm ${subtle} space-y-1.5 list-decimal pl-5`}>
            <li>A traveler sends a request on TANEXPO. You get a WhatsApp message.</li>
            <li>Reply there: accept it, send a price, or write back.</li>
            <li>Got a customer in your own WhatsApp? Forward their message to TANEXPO and it is saved as a request.</li>
            <li>Every Monday morning you get a summary of the week.</li>
          </ol>
        </div>
        <div className="space-y-2">
          <h3 className={`text-sm font-bold ${strong}`}>Commands</h3>
          <dl className={`text-xs ${subtle} grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5`}>
            {[
              ['LEADS / MAOMBI', 'Open requests'],
              ['ACCEPT 12 / KUBALI 12', 'Mark as contacted'],
              ['QUOTE 12 2500000 / BEI', 'Send a price in TZS'],
              ['REPLY 12 … / JIBU', 'Message the traveler'],
              ['LOST 12 / FUTA 12', 'Close a request'],
              ['DIGEST / MUHTASARI', 'Weekly summary'],
              ['PAUSE / SIMAMISHA', 'Stop alerts'],
              ['RESUME / ENDELEA', 'Restart alerts']
            ].map(([cmd, meaning]) => (
              <React.Fragment key={cmd}>
                <dt className={`font-mono font-bold ${strong}`}>{cmd}</dt>
                <dd>{meaning}</dd>
              </React.Fragment>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
};
