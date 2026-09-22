import { useCallback, useEffect, useState } from 'react';
import { configurePwaIdentity, type PwaAppKind } from '@/lib/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export type PwaInstallResult = 'accepted' | 'dismissed' | 'ios' | 'unavailable' | 'installed';

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

export function usePwaInstall(kind: PwaAppKind = 'admin') {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());
  const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);

  useEffect(() => {
    configurePwaIdentity(kind);

    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', capturePrompt);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', capturePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [kind]);

  const install = useCallback(async (): Promise<PwaInstallResult> => {
    if (installed) return 'installed';
    if (isIos) return 'ios';
    if (!installPrompt) return 'unavailable';

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === 'accepted') setInstallPrompt(null);
    return choice.outcome;
  }, [installPrompt, installed, isIos]);

  return { install, installed, installReady: Boolean(installPrompt), isIos };
}
