import React, { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';

interface HeaderProps {
  onFileSelected: (file: File) => void;
  isDark?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onFileSelected,
  isDark = false,
}) => {
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
    <header
      className={`border-b sticky top-0 z-30 transition-colors duration-150 ${
        isDark
          ? 'bg-dark-bg border-dark-line text-dark-text'
          : 'bg-paper border-ink text-ink'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Custom inline stroke SVG shield with orange redaction bar */}
          <div
            className={`h-10 w-10 rounded-[4px] border flex items-center justify-center shrink-0 ${
              isDark
                ? 'bg-dark-panel border-dark-line'
                : 'bg-panel border-ink'
            }`}
            aria-hidden="true"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2.5L4.5 5.5V11.5C4.5 16.4 7.7 20.6 12 22C16.3 20.6 19.5 16.4 19.5 11.5V5.5L12 2.5Z"
                stroke={isDark ? '#EFE9DD' : '#15171A'}
                strokeWidth="1.75"
                strokeLinejoin="round"
              />
              <rect
                x="7.25"
                y="10.25"
                width="9.5"
                height="3.5"
                rx="1"
                fill={isDark ? '#F28B5B' : '#C2410C'}
              />
            </svg>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline sm:gap-3">
            <h1 className="text-xl font-bold tracking-tight">SafePaste</h1>
            <span
              className={`font-mono text-xs ${
                isDark ? 'text-dark-muted' : 'text-muted'
              }`}
            >
              client-side · zero-trust
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div
            className={`inline-flex items-center gap-2 rounded-[4px] border px-3 py-1.5 min-h-[36px] font-mono text-xs font-medium ${
              isDark
                ? 'bg-dark-panel border-dark-line text-dark-text'
                : 'bg-panel border-ink text-ink'
            }`}
            title="All scanning, checksum validation, and redaction execute locally in browser memory."
          >
            <span
              className={`h-2 w-2 rounded-full shrink-0 ${
                isDark ? 'bg-dark-accent' : 'bg-accent'
              }`}
              aria-hidden="true"
            />
            <span>
              {isOnline ? 'OFFLINE' : 'OFFLINE (DISCONNECTED)'} · connect-src
              &apos;none&apos;
            </span>
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
            aria-label="Upload .txt or .csv file"
            className={`inline-flex items-center gap-2 rounded-[4px] border px-3 py-2 min-h-[44px] sm:min-h-[36px] text-xs font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isDark
                ? 'bg-dark-panel border-dark-line text-dark-text hover:border-dark-accent focus-visible:outline-dark-accent'
                : 'bg-panel border-ink text-ink hover:bg-paper focus-visible:outline-accent'
            }`}
          >
            <Upload className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Upload</span>
          </button>
        </div>
      </div>
    </header>
  );
};
