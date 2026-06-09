import { WifiOff, Wifi } from 'lucide-react';
import useNetworkStatus from '../../hooks/useNetworkStatus';

export default function OfflineIndicator() {
  const { online } = useNetworkStatus();

  return (
    <div className={`fixed left-4 top-20 z-40 rounded-2xl border px-4 py-2 text-sm shadow-lg backdrop-blur transition-all ${online ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-600 dark:bg-emerald-900/80 dark:text-emerald-100' : 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-600 dark:bg-rose-950/90 dark:text-rose-100'}`}>
      <div className="flex items-center gap-2">
        {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
        <span>{online ? 'Online' : 'Offline — some features may be unavailable'}</span>
      </div>
    </div>
  );
}
