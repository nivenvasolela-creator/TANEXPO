import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Building2, 
  ShieldCheck, 
  Phone, 
  Mail, 
  MapPin, 
  Truck, 
  Languages, 
  Save, 
  CheckCircle2,
  MessageCircle,
  PauseCircle,
  PlayCircle,
  Unlink
} from 'lucide-react';

export const ProfileSettingsTab: React.FC = () => {
  const { activeProviderId, providers, updateProviderProfile } = useApp();

  const currentProvider = providers.find((p) => p.id === activeProviderId) || providers[0];

  const [name, setName] = useState(currentProvider?.name || '');
  const [tagline, setTagline] = useState(currentProvider?.tagline || '');
  const [location, setLocation] = useState(currentProvider?.location || '');
  const [officeAddress, setOfficeAddress] = useState(currentProvider?.officeAddress || '');
  const [talaLicense, setTalaLicense] = useState(currentProvider?.talaLicense || '');
  const [phone, setPhone] = useState(currentProvider?.phone || '');
  const [email, setEmail] = useState(currentProvider?.email || '');
  const [showContactAfterBooking, setShowContactAfterBooking] = useState<boolean>(
    currentProvider?.showContactAfterBooking !== false
  );
  const [fleetInfo, setFleetInfo] = useState(currentProvider?.fleetInfo || '');
  const [about, setAbout] = useState(currentProvider?.about || '');
  const [isSaved, setIsSaved] = useState(false);

  // WhatsApp Operator OS state
  const [waStatus, setWaStatus] = useState<{
    whatsappEnabled: boolean;
    linked: boolean;
    maskedNumber: string | null;
    optIn: boolean;
    paused: boolean;
    pendingOtp: { maskedPhone: string; expiresAt: string } | null;
  } | null>(null);
  const [waPhoneInput, setWaPhoneInput] = useState(currentProvider?.phone || '');
  const [waCodeInput, setWaCodeInput] = useState('');
  const [waSimulatedOtp, setWaSimulatedOtp] = useState<string | null>(null);
  const [waBusy, setWaBusy] = useState(false);
  const [waMsg, setWaMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const getToken = () => localStorage.getItem('tanexpo_auth_token') || '';

  const loadWaStatus = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/whatsapp/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWaStatus(data);
      }
    } catch {
      // ignore transient network errors
    }
  }, []);

  useEffect(() => {
    void loadWaStatus();
  }, [loadWaStatus, activeProviderId]);

  const handleRequestWaOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaMsg(null);
    setWaBusy(true);
    try {
      const res = await fetch('/api/whatsapp/link/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ phone: waPhoneInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setWaMsg({ type: 'err', text: data.error || 'Could not send verification code' });
      } else {
        setWaSimulatedOtp(data.simulatedOtp || null);
        setWaMsg({
          type: 'ok',
          text: data.simulatedOtp
            ? `Verification code issued for ${data.maskedPhone}. Reply VERIFY ${data.simulatedOtp} on WhatsApp or enter it below.`
            : `Verification code sent via WhatsApp to ${data.maskedPhone}.`
        });
        await loadWaStatus();
      }
    } catch {
      setWaMsg({ type: 'err', text: 'Network error while requesting verification code' });
    } finally {
      setWaBusy(false);
    }
  };

  const handleVerifyWaOtp = async () => {
    setWaMsg(null);
    setWaBusy(true);
    try {
      const res = await fetch('/api/whatsapp/link/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify({ code: waCodeInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setWaMsg({ type: 'err', text: data.error || 'Invalid verification code' });
      } else {
        setWaCodeInput('');
        setWaSimulatedOtp(null);
        setWaMsg({ type: 'ok', text: `WhatsApp connected (${data.maskedNumber}).` });
        await loadWaStatus();
      }
    } catch {
      setWaMsg({ type: 'err', text: 'Verification failed' });
    } finally {
      setWaBusy(false);
    }
  };

  const handleToggleWaSettings = async (patch: { optIn?: boolean; paused?: boolean }) => {
    setWaMsg(null);
    setWaBusy(true);
    try {
      const res = await fetch('/api/whatsapp/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}`
        },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (res.ok) {
        await loadWaStatus();
        setWaMsg({
          type: 'ok',
          text: data.paused
            ? 'WhatsApp alerts paused.'
            : data.optIn
            ? 'WhatsApp lead alerts active.'
            : 'WhatsApp lead alerts disabled.'
        });
      }
    } finally {
      setWaBusy(false);
    }
  };

  const handleUnlinkWa = async () => {
    setWaMsg(null);
    setWaBusy(true);
    try {
      const res = await fetch('/api/whatsapp/link/unlink', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (res.ok) {
        setWaSimulatedOtp(null);
        setWaMsg({ type: 'ok', text: 'WhatsApp number unlinked.' });
        await loadWaStatus();
      }
    } finally {
      setWaBusy(false);
    }
  };

  if (!currentProvider) {
    return (
      <div className="bg-white dark:bg-[#152019] p-8 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] text-center text-xs text-[#6B7A72] dark:text-[#8DA195]">
        No operator profile loaded.
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProviderProfile({
      ...currentProvider,
      name,
      tagline,
      location,
      officeAddress,
      talaLicense,
      phone,
      email,
      showContactAfterBooking,
      fleetInfo,
      about
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3500);
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#152019] p-6 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs transition-colors">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#D97843] block">
            Operator Credentials
          </span>
          <h2 className="font-serif text-2xl font-bold text-[#284435] dark:text-[#EDF3EF]">
            Profile & Licensing Settings
          </h2>
          <p className="text-xs text-[#6B7A72] dark:text-[#8DA195] mt-0.5">
            Configure your public profile, TALA licensing details, office headquarters, and dispatch contacts.
          </p>
        </div>

        {isSaved && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Profile Updated!</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-[#152019] p-6 sm:p-8 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs space-y-5 transition-colors">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">TALA Tourism License *</label>
            <input
              type="text"
              required
              value={talaLicense}
              onChange={(e) => setTalaLicense(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Company Tagline</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">City / Region Base *</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Physical Office Address</label>
            <input
              type="text"
              value={officeAddress}
              onChange={(e) => setOfficeAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Public Dispatch Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+255 7XX XXX XXX"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Public Contact Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="bookings@operator.co.tz"
              className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </div>
        </div>

        <label className="flex items-start gap-2.5 p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#101914] border border-[#E8DFC9] dark:border-[#23352A] text-xs cursor-pointer">
          <input
            type="checkbox"
            checked={showContactAfterBooking}
            onChange={(e) => setShowContactAfterBooking(e.target.checked)}
            className="mt-0.5 rounded border-[#DED5C6] text-[#284435]"
          />
          <div>
            <span className="font-bold text-[#284435] dark:text-[#EDF3EF] block">
              Hide direct phone and email until booking is confirmed
            </span>
            <span className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
              Recommended: guests and unbooked travelers send inquiries through TANEXPO, and only travelers with confirmed bookings see your dispatch line.
            </span>
          </div>
        </label>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">Fleet & Safari Equipment Specs</label>
          <input
            type="text"
            value={fleetInfo}
            onChange={(e) => setFleetInfo(e.target.value)}
            placeholder="e.g. 6x Toyota Land Cruiser 4x4 with open pop-up roof and fridge"
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">About Company Narrative</label>
          <textarea
            rows={4}
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden resize-none"
          />
        </div>

        <div className="pt-4 border-t border-[#F0EBE0] dark:border-[#23352A] flex justify-end">
          <button
            type="submit"
            className="min-h-[42px] px-6 py-2.5 rounded-xl bg-[#284435] dark:bg-emerald-800 hover:bg-[#1E332A] dark:hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Updates</span>
          </button>
        </div>
      </form>

      {/* WhatsApp Operator OS Integration Card */}
      <div className="bg-white dark:bg-[#152019] p-6 sm:p-8 rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-xs space-y-5 transition-colors">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#F0EBE0] dark:border-[#23352A] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 block">
                WhatsApp Operator OS
              </span>
              <h3 className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">
                Manage Leads & Quotes via WhatsApp
              </h3>
              <p className="text-xs text-[#6B7A72] dark:text-[#8DA195] mt-0.5">
                Receive instant inquiry alerts and reply with TZS quotes straight from WhatsApp in English or Swahili.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {waStatus && !waStatus.whatsappEnabled && (
              <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                Simulator mode
              </span>
            )}
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                waStatus?.linked
                  ? waStatus.paused
                    ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-[#FAF7F2] dark:bg-[#101914] text-[#6B7A72] dark:text-[#8DA195] border-[#E8DFC9] dark:border-[#23352A]'
              }`}
            >
              {waStatus?.linked
                ? waStatus.paused
                  ? `Paused (${waStatus.maskedNumber})`
                  : `Connected (${waStatus.maskedNumber})`
                : 'Not Linked'}
            </span>
          </div>
        </div>

        {waMsg && (
          <div
            className={`p-3 rounded-xl text-xs border ${
              waMsg.type === 'ok'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            }`}
          >
            {waMsg.text}
          </div>
        )}

        {waStatus?.linked ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#101914] border border-[#E8DFC9] dark:border-[#23352A]">
              <div>
                <p className="text-xs font-bold text-[#284435] dark:text-[#EDF3EF]">
                  Active Operator Number: {waStatus.maskedNumber}
                </p>
                <p className="text-[11px] text-[#6B7A72] dark:text-[#8DA195]">
                  {waStatus.paused
                    ? 'Notifications are paused. Resume anytime to receive new leads.'
                    : 'Receiving instant notifications for new traveler requests.'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={waBusy}
                  onClick={() => handleToggleWaSettings({ paused: !waStatus.paused })}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#152019] hover:bg-[#EDE5D5] dark:hover:bg-[#1A2820] text-[#284435] dark:text-[#EDF3EF] border border-[#E8DFC9] dark:border-[#23352A] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {waStatus.paused ? (
                    <>
                      <PlayCircle className="w-4 h-4 text-emerald-600" />
                      <span>Resume Alerts</span>
                    </>
                  ) : (
                    <>
                      <PauseCircle className="w-4 h-4 text-amber-600" />
                      <span>Pause Alerts</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={waBusy}
                  onClick={handleUnlinkWa}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-white dark:bg-[#152019] hover:bg-red-50 dark:hover:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>Unlink</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleRequestWaOtp} className="flex flex-col sm:flex-row gap-3">
              <input
                type="tel"
                required
                value={waPhoneInput}
                onChange={(e) => setWaPhoneInput(e.target.value)}
                placeholder="+255 7XX XXX XXX"
                aria-label="Operator WhatsApp phone number"
                className="flex-1 min-h-[42px] px-3 py-2 text-xs rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#101914] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
              />
              <button
                type="submit"
                disabled={waBusy}
                className="min-h-[42px] px-5 py-2 rounded-xl bg-[#284435] dark:bg-emerald-800 hover:bg-[#1E332A] dark:hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shrink-0"
              >
                Send Verification Code
              </button>
            </form>

            {(waStatus?.pendingOtp || waSimulatedOtp) && (
              <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#101914] border border-[#E8DFC9] dark:border-[#23352A] space-y-3">
                <p className="text-xs text-[#4D5E55] dark:text-[#A7B9B0]">
                  Enter the 6-digit code below or reply <strong>VERIFY &lt;code&gt;</strong> from WhatsApp:
                </p>
                {waSimulatedOtp && (
                  <p className="text-xs font-mono font-bold text-[#284435] dark:text-emerald-300">
                    Simulated Code: {waSimulatedOtp}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={waCodeInput}
                    onChange={(e) => setWaCodeInput(e.target.value)}
                    placeholder="6-digit code"
                    aria-label="6-digit WhatsApp verification code"
                    className="sm:w-48 min-h-[42px] px-3 py-2 text-xs font-mono rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#152019] text-[#1F2A24] dark:text-[#EDF3EF]"
                  />
                  <button
                    type="button"
                    disabled={waBusy || waCodeInput.trim().length !== 6}
                    onClick={handleVerifyWaOtp}
                    className="min-h-[42px] px-5 py-2 rounded-xl bg-[#D97843] hover:bg-[#C26735] disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                  >
                    Verify &amp; Link
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 rounded-2xl bg-[#FAF7F2] dark:bg-[#101914] border border-[#E8DFC9] dark:border-[#23352A] text-[11px] text-[#4D5E55] dark:text-[#A7B9B0] space-y-1.5">
          <span className="font-bold text-[#284435] dark:text-[#EDF3EF] block">
            WhatsApp Commands (English &amp; Swahili):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[11px]">
            <span>• LEADS / MAOMBI</span>
            <span>• ACCEPT &lt;id&gt; / KUBALI</span>
            <span>• QUOTE &lt;id&gt; &lt;TZS&gt; [note]</span>
            <span>• REPLY &lt;id&gt; &lt;message&gt;</span>
            <span>• PAUSE / SIMAMISHA</span>
            <span>• RESUME / ENDELEA</span>
          </div>
        </div>
      </div>
    </div>
  );
};
