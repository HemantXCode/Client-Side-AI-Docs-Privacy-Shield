import React, { useRef, useState } from 'react';
import { Trash2, UploadCloud } from 'lucide-react';
import { SAMPLE_DATASETS, type SampleDataset } from '../data/samples';
import { CATEGORY_ORDER, type PiiCategory } from '../engine/patterns';
import { EntityChip } from './EntityChip';

interface SampleBarProps {
  activeSampleId: string | null;
  activeFilename: string | null;
  hasText: boolean;
  enabledCategories: Record<PiiCategory, boolean>;
  countsByCategory: Record<PiiCategory, number>;
  enforceAadhaarVerhoeff: boolean;
  isDark?: boolean;
  onSelectSample: (sample: SampleDataset) => void;
  onClear: () => void;
  onFileSelected: (file: File) => void;
  onToggleCategory: (category: PiiCategory) => void;
  onToggleAadhaarVerhoeff: () => void;
}

const SHORT_SAMPLE_LABELS: Record<SampleDataset['id'], string> = {
  resume: 'Resume',
  support: 'Support Ticket',
  csv: 'CRM CSV',
};

export const SampleBar: React.FC<SampleBarProps> = ({
  activeSampleId,
  activeFilename,
  hasText,
  enabledCategories,
  countsByCategory,
  enforceAadhaarVerhoeff,
  isDark = false,
  onSelectSample,
  onClear,
  onFileSelected,
  onToggleCategory,
  onToggleAadhaarVerhoeff,
}) => {
  const dropInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
      e.target.value = '';
    }
  };

  return (
    <section className="space-y-3">
      {/* Sample Loaders Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`font-mono text-[11px] font-semibold uppercase tracking-wider mr-1 ${
              isDark ? 'text-dark-muted' : 'text-muted'
            }`}
          >
            Samples
          </span>
          {SAMPLE_DATASETS.map((sample) => {
            const isActive = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => onSelectSample(sample)}
                title={sample.description}
                aria-pressed={isActive}
                className={`min-h-[44px] sm:min-h-[34px] rounded-[4px] border px-3 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  isDark
                    ? 'focus-visible:outline-dark-accent'
                    : 'focus-visible:outline-accent'
                } ${
                  isActive
                    ? isDark
                      ? 'bg-dark-accent text-dark-bg border-dark-accent font-semibold'
                      : 'bg-ink text-paper border-ink font-semibold'
                    : isDark
                      ? 'bg-dark-panel text-dark-text border-dark-line hover:border-dark-accent'
                      : 'bg-panel text-ink border-ink hover:bg-paper'
                }`}
              >
                {SHORT_SAMPLE_LABELS[sample.id]}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {activeFilename && (
            <span
              className={`rounded-[4px] border px-2.5 py-1.5 font-mono text-xs ${
                isDark
                  ? 'bg-dark-panel border-dark-line text-dark-text'
                  : 'bg-panel border-line text-ink'
              }`}
            >
              {activeFilename}
            </span>
          )}
          <button
            type="button"
            onClick={onClear}
            disabled={!hasText}
            aria-label="Clear input text"
            className={`inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[34px] rounded-[4px] border px-3 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isDark
                ? 'bg-dark-panel border-dark-line text-dark-text hover:border-dark-accent focus-visible:outline-dark-accent'
                : 'bg-panel border-ink text-ink hover:bg-paper focus-visible:outline-accent'
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden="true" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Drag-and-Drop File Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          ref={dropInputRef}
          id="safepaste-dropzone-input"
          type="file"
          accept=".txt,.csv"
          onChange={handleFileInput}
          className="hidden"
          aria-label="Choose a .txt or .csv file"
        />
        <label
          htmlFor="safepaste-dropzone-input"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              dropInputRef.current?.click();
            }
          }}
          className={`flex items-center justify-center gap-2.5 rounded-[4px] border-2 border-dashed px-4 py-3 min-h-[48px] text-center cursor-pointer transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 ${
            isDark
              ? 'focus-visible:outline-dark-accent'
              : 'focus-visible:outline-accent'
          } ${
            isDragging
              ? isDark
                ? 'bg-dark-panel border-dark-accent text-dark-text'
                : 'bg-panel border-accent text-ink'
              : isDark
                ? 'bg-dark-panel border-dark-line text-dark-text hover:border-dark-accent'
                : 'bg-panel border-ink text-ink hover:bg-paper'
          }`}
        >
          <UploadCloud
            className={`h-4 w-4 shrink-0 ${
              isDark ? 'text-dark-accent' : 'text-accent'
            }`}
            strokeWidth={1.75}
            aria-hidden="true"
          />
          <span className="font-mono text-xs">
            Drop .txt or .csv here, never uploaded, stays in memory
          </span>
        </label>
      </div>

      {/* Detector Category Toggles & Aadhaar Verhoeff Check */}
      <div
        className={`rounded-[4px] border px-3 py-2.5 flex flex-wrap items-center justify-between gap-2.5 ${
          isDark
            ? 'bg-dark-panel border-dark-line'
            : 'bg-panel border-line'
        }`}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          <span
            className={`font-mono text-[11px] font-semibold uppercase tracking-wider mr-1 ${
              isDark ? 'text-dark-muted' : 'text-muted'
            }`}
          >
            Detectors
          </span>
          {CATEGORY_ORDER.map((category) => (
            <EntityChip
              key={category}
              category={category}
              count={countsByCategory[category]}
              enabled={enabledCategories[category]}
              interactive
              isDark={isDark}
              onClick={() => onToggleCategory(category)}
            />
          ))}
        </div>

        <label
          className={`inline-flex items-center gap-2 min-h-[44px] sm:min-h-[32px] font-mono text-xs cursor-pointer select-none ${
            isDark ? 'text-dark-text' : 'text-ink'
          }`}
        >
          <input
            type="checkbox"
            checked={enforceAadhaarVerhoeff}
            onChange={onToggleAadhaarVerhoeff}
            className={`h-4 w-4 rounded-[4px] cursor-pointer ${
              isDark ? 'accent-dark-accent' : 'accent-accent'
            }`}
          />
          <span>Strict Aadhaar Verhoeff</span>
        </label>
      </div>
    </section>
  );
};
