import React, { useEffect, useState } from 'react';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useApp } from '../../context/AppContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { t } = useApp();

  if (isInstalled) return null;

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        aria-label={t('pwa.install', 'Install App')}
        className="min-h-[38px] flex items-center gap-1.5 rounded-xl bg-[#D97843] hover:bg-[#C26532] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span className={compact ? 'hidden sm:inline' : ''}>{t('pwa.install', 'Install App')}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          aria-label={t('pwa.install_ios', 'Install on iOS')}
          className="min-h-[38px] flex items-center gap-1.5 rounded-xl border border-[#DED5C6] dark:border-[#23352A] bg-white dark:bg-[#152019] px-2.5 py-1.5 text-xs font-semibold text-[#284435] dark:text-[#E2ECE5] hover:bg-[#FAF7F2] dark:hover:bg-[#1A2820] transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#D97843] shrink-0" />
          <span className="hidden sm:inline">{t('pwa.install', 'Install App')}</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={t('pwa.ios_title', 'Install TANEXPO on iPhone / iPad')}
          >
            <div className="w-full max-w-sm rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#152019] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl border border-[#E8DFC9] dark:border-[#23352A] space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-[#284435] dark:text-[#EDF3EF]">
                  {t('pwa.ios_title', 'Install TANEXPO on iPhone / iPad')}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label={t('common.close', 'Close')}
                  className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-[#1A2820] text-zinc-500 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-[#4D5E55] dark:text-[#B5C5BC] leading-relaxed">
                1. Tap the <strong>Share</strong> button in the Safari toolbar.
                <br />
                2. Scroll down and tap <strong>Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] rounded-xl bg-[#284435] text-white text-xs font-bold cursor-pointer"
              >
                {t('common.close', 'Got it')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineAndUpdateBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useApp();
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (isOnline && !needRefresh) return null;

  return (
    <div className="fixed bottom-20 md:bottom-5 left-4 right-4 sm:right-auto z-40 flex flex-col gap-2 max-w-sm pointer-events-none">
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto flex items-center gap-2 rounded-2xl bg-amber-600 text-white px-3.5 py-2.5 text-xs font-semibold shadow-lg border border-amber-400/40"
        >
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>{t('pwa.offline', 'Offline — showing saved catalog. Reconnect to send quotes.')}</span>
        </div>
      )}

      {needRefresh && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl bg-[#1C2C24] text-white px-4 py-2.5 text-xs font-semibold shadow-xl border border-white/15"
        >
          <span>{t('pwa.update_ready', 'Update ready')}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="px-3 py-1.5 rounded-xl bg-[#E8B94A] text-[#1C2C24] font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{t('pwa.reload', 'Reload')}</span>
            </button>
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              aria-label={t('common.dismiss', 'Dismiss')}
              className="p-1.5 text-zinc-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
