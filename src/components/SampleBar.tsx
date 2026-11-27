import React from 'react';
import { FileSpreadsheet, FileText, Sparkles, Ticket, Trash2 } from 'lucide-react';
import { SAMPLE_DATASETS, type SampleDataset } from '../data/samples';

interface SampleBarProps {
  activeSampleId: string | null;
  activeFilename: string | null;
  hasText: boolean;
  onSelectSample: (sample: SampleDataset) => void;
  onClear: () => void;
}

const SAMPLE_ICONS: Record<SampleDataset['id'], React.ReactNode> = {
  resume: <FileText className="h-3.5 w-3.5 text-sky-400" />,
  support: <Ticket className="h-3.5 w-3.5 text-amber-400" />,
  csv: <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />,
};

export const SampleBar: React.FC<SampleBarProps> = ({
  activeSampleId,
  activeFilename,
  hasText,
  onSelectSample,
  onClear,
}) => {
  return (
    <section className="rounded-xl border border-slate-800/80 bg-slate-900/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 mr-1">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          1-Click Samples:
        </span>
        {SAMPLE_DATASETS.map((sample) => {
          const isActive = activeSampleId === sample.id;
          return (
            <button
              key={sample.id}
              type="button"
              onClick={() => onSelectSample(sample)}
              title={sample.description}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium border transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-200 shadow-sm shadow-emerald-950/50'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700/80 text-slate-200 hover:border-slate-600'
              }`}
            >
              {SAMPLE_ICONS[sample.id]}
              <span>{sample.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 ml-auto">
        {activeFilename && (
          <span className="inline-flex items-center rounded-md bg-slate-800/90 border border-slate-700 px-2.5 py-1 text-xs font-mono text-slate-300">
            {activeFilename}
          </span>
        )}
        <button
          type="button"
          onClick={onClear}
          disabled={!hasText}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/60 hover:bg-rose-950/50 hover:border-rose-500/40 hover:text-rose-200 disabled:opacity-40 disabled:pointer-events-none px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear
        </button>
      </div>
    </section>
  );
};
