import React, { useCallback, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useModalAccessibility } from '../../hooks/useModalAccessibility';
import { ShieldCheck, ShieldAlert, X, Search } from 'lucide-react';

/**
 * Admin-only list of operators with a button to mark each one verified (after checking their
 * TALA licence) or to withdraw verification. The server re-checks the admin role on every call.
 */
export const AdminVerifyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { providers, refreshData } = useApp();
  const containerRef = useModalAccessibility(true, onClose);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const setVerified = useCallback(
    async (providerId: number, verified: boolean) => {
      setError('');
      setBusyId(providerId);
      try {
        const res = await fetch(`/api/admin/providers/${providerId}/verify`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('tanexpo_auth_token') || ''}`
          },
          body: JSON.stringify({ verified, verificationStatus: verified ? 'tanexpo_verified' : 'under_review' })
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data.error || 'Could not update this operator');
          return;
        }
        await refreshData();
      } catch {
        setError('Network problem. Try again.');
      } finally {
        setBusyId(null);
      }
    },
    [refreshData]
  );

  const q = query.trim().toLowerCase();
  const list = providers
    .filter((p) => (filter === 'pending' ? !p.verified : true))
    .filter((p) => !q || p.name.toLowerCase().includes(q) || (p.talaLicense || '').toLowerCase().includes(q))
    .sort((a, b) => Number(a.verified) - Number(b.verified) || b.id - a.id);
  const pendingCount = providers.filter((p) => !p.verified).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-verify-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-2xl max-h-[90vh] flex flex-col bg-[#FAF7F2] dark:bg-[#101914] rounded-t-3xl sm:rounded-3xl border border-[#E8DFC9] dark:border-[#23352A] shadow-2xl focus:outline-hidden"
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 pt-5 pb-4 border-b border-[#E8DFC9] dark:border-[#23352A]">
          <div>
            <h2 id="admin-verify-title" className="font-serif text-xl font-bold text-[#284435] dark:text-[#EDF3EF]">
              Verify operators
            </h2>
            <p className="text-sm text-[#6B7A72] dark:text-[#8DA195] mt-0.5">
              Check the TALA licence before verifying. Verified operators get the badge travelers see.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#6B7A72] hover:bg-[#EDE5D5] dark:hover:bg-[#1A2820] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-3 flex flex-col sm:flex-row gap-2 border-b border-[#E8DFC9] dark:border-[#23352A]">
          <label className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9790]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or licence number"
              aria-label="Search operators"
              className="w-full min-h-[44px] pl-9 pr-3 text-sm rounded-xl border border-[#DED5C6] dark:border-[#2A3E31] bg-white dark:bg-[#152019] text-[#1F2A24] dark:text-[#EDF3EF] focus:outline-hidden"
            />
          </label>
          <div className="flex rounded-xl border border-[#E8DFC9] dark:border-[#23352A] overflow-hidden shrink-0" role="group" aria-label="Which operators to show">
            {(['pending', 'all'] as const).map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={filter === f}
                onClick={() => setFilter(f)}
                className={`flex-1 sm:flex-none min-h-[44px] px-4 text-sm font-bold cursor-pointer ${
                  filter === f ? 'bg-[#284435] dark:bg-emerald-800 text-white' : 'bg-white dark:bg-[#152019] text-[#284435] dark:text-[#EDF3EF]'
                }`}
              >
                {f === 'pending' ? `Pending (${pendingCount})` : `All (${providers.length})`}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p role="alert" className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl text-sm bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
            {error}
          </p>
        )}

        <ul className="flex-1 overflow-y-auto px-5 sm:px-6 py-3 space-y-2.5">
          {list.length === 0 && (
            <li className="py-10 text-center text-sm text-[#6B7A72] dark:text-[#8DA195]">
              {filter === 'pending' ? 'No operators waiting for verification.' : 'No operators match.'}
            </li>
          )}
          {list.map((p) => (
            <li
              key={p.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#152019] border border-[#E8DFC9] dark:border-[#23352A]"
            >
              <div className="min-w-0">
                <p className="font-serif font-bold text-[#284435] dark:text-[#EDF3EF] truncate">{p.name}</p>
                <p className="text-xs text-[#6B7A72] dark:text-[#8DA195] mt-0.5">
                  {p.location} · TALA licence:{' '}
                  <span className="font-mono font-semibold text-[#1F2A24] dark:text-[#EDF3EF]">
                    {p.talaLicense || 'not provided'}
                  </span>
                </p>
                <span
                  className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    p.verified
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {p.verified ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                  {p.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <button
                type="button"
                disabled={busyId === p.id}
                onClick={() => void setVerified(p.id, !p.verified)}
                className={`min-h-[44px] px-4 rounded-xl text-sm font-bold cursor-pointer shrink-0 disabled:opacity-50 ${
                  p.verified
                    ? 'bg-white dark:bg-[#101914] text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/60 hover:bg-red-50 dark:hover:bg-red-950/40'
                    : 'bg-[#284435] dark:bg-emerald-800 hover:bg-[#1E332A] dark:hover:bg-emerald-700 text-white'
                }`}
              >
                {busyId === p.id ? 'Saving…' : p.verified ? 'Remove verification' : 'Mark verified'}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
