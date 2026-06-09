import { useEffect, useState } from 'react';
import { Download, CheckCircle2, X } from 'lucide-react';
import useNetworkStatus from '../../hooks/useNetworkStatus';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);
  const { online } = useNetworkStatus();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setDeferredPrompt(event);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      return;
    }

    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setInstalled(true);
      setVisible(false);
      setDeferredPrompt(null);
    }
  };

  if (!visible || installed || !online) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-950 dark:shadow-black/10 sm:right-auto sm:left-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Install Dress Manager</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Add the app to your home screen for fast access, offline mode, and native-like behavior.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setVisible(false)}
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={handleInstall}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <CheckCircle2 className="h-4 w-4" />
          Install App
        </button>
      </div>
    </div>
  );
}
