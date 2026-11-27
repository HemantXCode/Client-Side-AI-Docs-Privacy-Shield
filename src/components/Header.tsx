import React, { useEffect, useRef, useState } from 'react';
import { Lock, ShieldCheck, Upload, WifiOff } from 'lucide-react';

interface HeaderProps {
  onFileSelected: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({ onFileSelected }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      e.target.value = '';
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/25 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-50">
                SafePaste
              </h1>
              <span className="hidden sm:inline-flex items-center rounded-md bg-slate-800/90 px-2 py-0.5 text-[11px] font-medium text-slate-300 border border-slate-700">
                Zero-Trust PII Shield
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Sanitize logs, resumes, tickets & CSVs locally before sharing with AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className="inline-flex items-center gap-2 rounded-full bg-emerald-950/60 border border-emerald-500/35 px-3 py-1.5 text-xs font-medium text-emerald-300"
            title="All regex scanning, Luhn verification, and redaction run 100% inside your browser memory."
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <Lock className="h-3.5 w-3.5 text-emerald-400" />
            <span>100% Local • 0 KB Sent • Offline Ready</span>
            {!isOnline && (
              <span className="inline-flex items-center gap-1 ml-1 pl-1.5 border-l border-emerald-500/30 text-emerald-200">
                <WifiOff className="h-3 w-3" />
                Offline
              </span>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv"
            onChange={handleInputChange}
            className="hidden"
            aria-label="Upload .txt or .csv file"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-700/80 border border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-100 transition-colors cursor-pointer"
          >
            <Upload className="h-3.5 w-3.5 text-cyan-400" />
            Upload .txt / .csv
          </button>
        </div>
      </div>
    </header>
  );
};
