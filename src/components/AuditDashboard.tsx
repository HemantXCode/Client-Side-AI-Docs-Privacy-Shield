import React from 'react';
import {
  Activity,
  CheckCircle2,
  EyeOff,
  Fingerprint,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import {
  CATEGORY_ORDER,
  PII_CATEGORIES,
  type PiiCategory,
} from '../engine/patterns';
import type { AuditStats, RedactionMode, RiskLevel } from '../engine/sanitizer';

interface AuditDashboardProps {
  audit: AuditStats;
  mode: RedactionMode;
  enabledCategories: Record<PiiCategory, boolean>;
  enforceAadhaarVerhoeff: boolean;
  onModeChange: (mode: RedactionMode) => void;
  onToggleCategory: (category: PiiCategory) => void;
  onToggleAadhaarVerhoeff: () => void;
}

const RISK_STYLES: Record<
  RiskLevel,
  { bar: string; badge: string; text: string }
> = {
  Safe: {
    bar: 'bg-emerald-500',
    badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35',
    text: 'text-emerald-300',
  },
  Low: {
    bar: 'bg-sky-500',
    badge: 'bg-sky-500/15 text-sky-300 border-sky-500/35',
    text: 'text-sky-300',
  },
  Medium: {
    bar: 'bg-amber-500',
    badge: 'bg-amber-500/15 text-amber-300 border-amber-500/35',
    text: 'text-amber-300',
  },
  High: {
    bar: 'bg-orange-500',
    badge: 'bg-orange-500/15 text-orange-300 border-orange-500/35',
    text: 'text-orange-300',
  },
  Critical: {
    bar: 'bg-rose-500',
    badge: 'bg-rose-500/15 text-rose-300 border-rose-500/35',
    text: 'text-rose-300',
  },
};

const REDACTION_MODES: Array<{
  id: RedactionMode;
  label: string;
  example: string;
  description: string;
}> = [
  {
    id: 'full',
    label: 'Full Mask',
    example: '[EMAIL_REDACTED]',
    description: 'Zero leakage fixed blocks',
  },
  {
    id: 'partial',
    label: 'Partial Mask',
    example: 'r***@acme.io',
    description: 'Retains last-4 / domain context',
  },
  {
    id: 'pseudonym',
    label: 'Consistent Pseudonym',
    example: 'EMAIL_01',
    description: 'AI-safe deterministic tokens',
  },
];

export const AuditDashboard: React.FC<AuditDashboardProps> = ({
  audit,
  mode,
  enabledCategories,
  enforceAadhaarVerhoeff,
  onModeChange,
  onToggleCategory,
  onToggleAadhaarVerhoeff,
}) => {
  const riskStyle = RISK_STYLES[audit.riskLevel];
  const hasDetections = audit.totalDetections > 0;

  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 space-y-4">
      {/* Top Row: Risk Meter + Audit Badges + Mode Switcher */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
        {/* Privacy Risk Meter */}
        <div className="xl:col-span-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              {hasDetections ? (
                <ShieldAlert className="h-4 w-4 text-amber-400" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              )}
              Privacy Risk Meter
            </span>
            <div className="flex items-center gap-1.5 text-[11px]">
              <span
                className={`rounded-full border px-2 py-0.5 font-semibold ${riskStyle.badge}`}
              >
                Input: {audit.riskLevel} ({audit.riskScore}/100)
              </span>
              <span className="text-slate-500">→</span>
              <span className="rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2 py-0.5 font-semibold text-emerald-300">
                Output: 100% Safe
              </span>
            </div>
          </div>

          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${riskStyle.bar}`}
              style={{ width: `${Math.max(4, audit.riskScore)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>
              <strong className="text-slate-200">{audit.totalDetections}</strong>{' '}
              PII {audit.totalDetections === 1 ? 'entity' : 'entities'} redacted
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-slate-400">
              <Activity className="h-3 w-3 text-emerald-400" />
              {audit.processingTimeMs} ms
            </span>
          </div>
        </div>

        {/* False Positives Ignored (Luhn Verified) */}
        <div className="xl:col-span-3 rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-cyan-400" />
              False Positives Ignored
            </span>
            <span className="rounded-md bg-cyan-500/10 border border-cyan-500/30 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
              Luhn Verified
            </span>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl font-bold tabular-nums text-cyan-300">
              {audit.falsePositivesIgnored}
            </span>
            <span className="text-xs text-slate-400 leading-snug">
              non-PII numeric IDs safely preserved
            </span>
          </div>

          <div className="text-[11px] text-slate-400 truncate">
            {audit.rejectedCandidates.length > 0 ? (
              <span>
                Ignored:{' '}
                <code className="text-cyan-300 font-mono">
                  {audit.rejectedCandidates.map((c) => c.raw).join(', ')}
                </code>
              </span>
            ) : (
              <span>Random 16-digit Order/Tracking IDs won&apos;t break logs</span>
            )}
          </div>
        </div>

        {/* 3-Mode Redaction Switcher */}
        <div className="xl:col-span-5 rounded-lg border border-slate-800 bg-slate-950/70 p-3.5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <EyeOff className="h-4 w-4 text-violet-400" />
              Redaction Mode
            </span>
            <span className="text-[11px] text-slate-400">
              Updates diff & export instantly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {REDACTION_MODES.map((item) => {
              const active = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onModeChange(item.id)}
                  className={`text-left rounded-lg border px-2.5 py-2 transition-all cursor-pointer ${
                    active
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-100 shadow-sm'
                      : 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-semibold">{item.label}</span>
                    {item.id === 'pseudonym' && (
                      <Fingerprint className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate">
                    {item.example}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Row: Category Toggles & Aadhaar Verhoeff Option */}
      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
            <SlidersHorizontal className="h-3 w-3" />
            Detectors:
          </span>
          {CATEGORY_ORDER.map((category) => {
            const meta = PII_CATEGORIES[category];
            const enabled = enabledCategories[category];
            const count = audit.countsByCategory[category];
            return (
              <button
                key={category}
                type="button"
                onClick={() => onToggleCategory(category)}
                aria-pressed={enabled}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                  enabled
                    ? meta.badgeClass
                    : 'bg-slate-900 text-slate-500 border-slate-800 line-through opacity-70 hover:opacity-100'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    enabled ? meta.dotClass : 'bg-slate-600'
                  }`}
                />
                <span>{meta.shortLabel}</span>
                <span className="rounded-full bg-slate-950/60 px-1.5 py-0.2 text-[10px] font-mono tabular-nums">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={enforceAadhaarVerhoeff}
            onChange={onToggleAadhaarVerhoeff}
            className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/40 cursor-pointer"
          />
          <span>Strict Aadhaar Verhoeff Checksum</span>
        </label>
      </div>
    </section>
  );
};
