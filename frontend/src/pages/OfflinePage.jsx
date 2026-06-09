import React from 'react';
import { CloudOff, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 py-12 text-center dark:bg-slate-950 dark:text-white">
      <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        <CloudOff className="mx-auto mb-6 h-16 w-16 text-blue-600" />
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">You’re offline</h1>
        <p className="mt-4 max-w-md text-sm text-slate-600 dark:text-slate-300">
          Previously visited pages are available from cache. Some live data may be unavailable until your connection returns.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
