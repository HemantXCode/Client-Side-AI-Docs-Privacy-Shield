import React, { useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import { CATEGORY_ORDER } from '../engine/patterns';
import type { AuditStats, RedactionMode } from '../engine/sanitizer';
import { EntityChip } from './EntityChip';
import { ModeSwitch } from './ModeSwitch';
import { RiskMeter } from './RiskMeter';

interface AuditDashboardProps {
  audit: AuditStats;
  mode: RedactionMode;
  hasOutput: boolean;
  outputFilename: string;
  variant: 'mobile-summary' | 'footer';
  onModeChange: (mode: RedactionMode) => void;
  onCopyOutput: () => Promise<boolean>;
  onDownloadOutput: () => void;
}

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  audit,
  mode,
  hasOutput,
  outputFilename,
  variant,
  onModeChange,
  onCopyOutput,
  onDownloadOutput,
}) => {
  const [copied, setCopied] = useState(false);
  const isDark = mode === 'pseudonym';

  const handleCopy = async () => {
    const ok = await onCopyOutput();
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  if (variant === 'mobile-summary') {
    const detectedCategories = CATEGORY_ORDER.filter(
      (cat) => audit.countsByCategory[cat] > 0
    );

    return (
      <section
        aria-label="Scan result summary"
        className={`lg:hidden rounded-[4px] border p-4 space-y-3 ${
          isDark
            ? 'bg-dark-panel border-dark-line text-dark-text'
            : 'bg-panel border-ink text-ink'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span
              className={`font-mono text-[11px] font-semibold uppercase tracking-wider block ${
                isDark ? 'text-dark-muted' : 'text-muted'
              }`}
            >
              Scan result
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-bold tabular-nums">
                {audit.totalDetections}
              </span>
              <span
                className={`font-mono text-xs ${
                  isDark ? 'text-dark-muted' : 'text-muted'
                }`}
              >
                found · {audit.falsePositivesIgnored} ignored
              </span>
            </div>
          </div>

          <RiskMeter
            riskScore={audit.riskScore}
            riskLevel={audit.riskLevel}
            isDark={isDark}
          />
        </div>

        {detectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {detectedCategories.map((cat) => (
              <EntityChip
                key={cat}
                category={cat}
                count={audit.countsByCategory[cat]}
                isDark={isDark}
              />
            ))}
          </div>
        )}

        <ModeSwitch
          mode={mode}
          onModeChange={onModeChange}
          isDark={isDark}
        />
      </section>
    );
  }

  const downloadExt = outputFilename.endsWith('.csv') ? '.csv' : '.txt';

  return (
    <footer
      className={`rounded-[4px] border p-3 sm:px-4 sm:py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 transition-colors duration-150 ${
        isDark
          ? 'bg-dark-panel border-dark-line text-dark-text'
          : 'bg-panel border-ink text-ink'
      }`}
    >
      {/* Mode Switch (Desktop; mobile shows scrollable switch in Scan result card too) */}
      <div className="hidden lg:block">
        <ModeSwitch
          mode={mode}
          onModeChange={onModeChange}
          isDark={isDark}
        />
      </div>

      {/* Risk Meter & Live Counters */}
      <div className="hidden lg:flex items-center gap-5">
        <RiskMeter
          riskScore={audit.riskScore}
          riskLevel={audit.riskLevel}
          isDark={isDark}
        />
        <span
          className={`font-mono text-xs font-medium tabular-nums ${
            isDark ? 'text-dark-text' : 'text-ink'
          }`}
        >
          {audit.totalDetections} found · {audit.falsePositivesIgnored} ignored
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto">
        <button
          type="button"
          onClick={handleCopy}
          disabled={!hasOutput}
          aria-label="Copy sanitized output"
          className={`inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[36px] rounded-[4px] border px-3.5 py-2 text-xs font-medium transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 ${
            isDark
              ? 'bg-dark-bg border-dark-line text-dark-text hover:border-dark-accent focus-visible:outline-dark-accent'
              : 'bg-paper border-ink text-ink hover:bg-panel focus-visible:outline-accent'
          }`}
        >
          {copied ? (
            <Check className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          type="button"
          onClick={onDownloadOutput}
          disabled={!hasOutput}
          className={`inline-flex items-center justify-center gap-2 min-h-[44px] sm:min-h-[36px] w-full lg:w-auto rounded-[4px] border px-4 py-2 text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 ${
            isDark
              ? 'bg-dark-accent border-dark-accent text-dark-bg hover:opacity-90 focus-visible:outline-dark-accent'
              : 'bg-accent border-ink text-white hover:opacity-95 focus-visible:outline-accent'
          }`}
        >
          <Download className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
          <span className="lg:hidden">Download sanitized file</span>
          <span className="hidden lg:inline">Download {downloadExt}</span>
        </button>
      </div>
    </footer>
  );
};
