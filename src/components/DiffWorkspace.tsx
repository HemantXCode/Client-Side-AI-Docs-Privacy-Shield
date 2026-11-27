import React, { useMemo, useState } from 'react';
import { ClipboardPaste, Edit3, Eye, FileKey2 } from 'lucide-react';
import type {
  DetectedSpan,
  RedactionMode,
  RejectedCandidate,
  SanitizationResult,
} from '../engine/sanitizer';
import { CATEGORY_THEME } from './themeTokens';

interface DiffWorkspaceProps {
  rawText: string;
  mode: RedactionMode;
  result: SanitizationResult;
  leftViewMode: 'edit' | 'inspect';
  onLeftViewModeChange: (view: 'edit' | 'inspect') => void;
  onTextChange: (text: string) => void;
  onFileDropped: (file: File) => void;
  onDownloadPseudonymKey: () => void;
  onNotify: (message: string) => void;
}

type LeftFragment =
  | { kind: 'plain'; text: string; key: string }
  | { kind: 'pii'; span: DetectedSpan; key: string }
  | { kind: 'rejected'; rejected: RejectedCandidate; key: string };

export const DiffWorkspace: React.FC<DiffWorkspaceProps> = ({
  rawText,
  mode,
  result,
  leftViewMode,
  onLeftViewModeChange,
  onTextChange,
  onFileDropped,
  onDownloadPseudonymKey,
  onNotify,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDark = mode === 'pseudonym';

  const leftFragments = useMemo<LeftFragment[]>(() => {
    if (!rawText) return [];

    type Marker =
      | { start: number; end: number; type: 'pii'; span: DetectedSpan }
      | {
          start: number;
          end: number;
          type: 'rejected';
          rejected: RejectedCandidate;
        };

    const markers: Marker[] = [
      ...result.spans.map((span) => ({
        start: span.start,
        end: span.end,
        type: 'pii' as const,
        span,
      })),
    ];

    for (const rejected of result.audit.rejectedCandidates) {
      const overlaps = markers.some(
        (m) => rejected.start < m.end && rejected.end > m.start
      );
      if (!overlaps) {
        markers.push({
          start: rejected.start,
          end: rejected.end,
          type: 'rejected',
          rejected,
        });
      }
    }

    markers.sort((a, b) => a.start - b.start);

    const fragments: LeftFragment[] = [];
    let cursor = 0;

    markers.forEach((marker, idx) => {
      if (marker.start > cursor) {
        fragments.push({
          kind: 'plain',
          text: rawText.slice(cursor, marker.start),
          key: `plain-${idx}-${cursor}`,
        });
      }
      if (marker.type === 'pii') {
        fragments.push({
          kind: 'pii',
          span: marker.span,
          key: marker.span.id,
        });
      } else {
        fragments.push({
          kind: 'rejected',
          rejected: marker.rejected,
          key: `rej-${idx}-${marker.start}`,
        });
      }
      cursor = marker.end;
    });

    if (cursor < rawText.length) {
      fragments.push({
        kind: 'plain',
        text: rawText.slice(cursor),
        key: `plain-end-${cursor}`,
      });
    }

    return fragments;
  }, [rawText, result.spans, result.audit.rejectedCandidates]);

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onTextChange(clipText);
        onLeftViewModeChange('inspect');
        onNotify('Pasted clipboard text & scanned locally.');
      }
    } catch {
      onLeftViewModeChange('edit');
      onNotify('Paste directly into the editor (Ctrl+V).');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileDropped(file);
    }
  };

  const showEditor = leftViewMode === 'edit' || !rawText;
  const pseudonymEntries = Object.entries(result.pseudonymKey.mappings);
  const formattedMappingJson = useMemo(
    () => JSON.stringify(result.pseudonymKey, null, 2),
    [result.pseudonymKey]
  );

  return (
    <section
      className={`grid grid-cols-1 gap-4 ${
        isDark ? 'lg:grid-cols-12' : 'lg:grid-cols-2'
      }`}
    >
      {/* 01 · RAW INPUT */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-[4px] border flex flex-col min-h-[380px] transition-colors duration-150 ${
          isDark ? 'lg:col-span-4' : ''
        } ${
          isDragging
            ? isDark
              ? 'bg-dark-panel border-dark-accent'
              : 'bg-panel border-accent'
            : isDark
              ? 'bg-dark-panel border-dark-line'
              : 'bg-panel border-ink'
        }`}
      >
        <div
          className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${
            isDark ? 'border-dark-line' : 'border-line'
          }`}
        >
          <div className="flex items-center gap-2">
            <h2
              className={`font-mono text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-dark-text' : 'text-ink'
              }`}
            >
              01 · RAW INPUT
            </h2>
            {rawText && (
              <span
                className={`font-mono text-[11px] ${
                  isDark ? 'text-dark-muted' : 'text-muted'
                }`}
              >
                {rawText.length.toLocaleString()} chars
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePasteClipboard}
              aria-label="Paste text from clipboard"
              className={`inline-flex items-center gap-1.5 min-h-[44px] sm:min-h-[32px] rounded-[4px] border px-2.5 py-1 font-mono text-xs transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
                isDark
                  ? 'bg-dark-bg border-dark-line text-dark-text hover:border-dark-accent focus-visible:outline-dark-accent'
                  : 'bg-paper border-ink text-ink hover:bg-panel focus-visible:outline-accent'
              }`}
            >
              <ClipboardPaste
                className="h-3.5 w-3.5"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <span>Paste</span>
            </button>

            {rawText && (
              <div
                role="group"
                aria-label="Raw input view mode"
                className={`inline-flex rounded-[4px] border p-0.5 ${
                  isDark
                    ? 'bg-dark-bg border-dark-line'
                    : 'bg-paper border-ink'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onLeftViewModeChange('inspect')}
                  aria-pressed={!showEditor}
                  className={`inline-flex items-center gap-1 min-h-[40px] sm:min-h-[28px] rounded-[4px] px-2 py-0.5 font-mono text-xs transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isDark
                      ? 'focus-visible:outline-dark-accent'
                      : 'focus-visible:outline-accent'
                  } ${
                    !showEditor
                      ? isDark
                        ? 'bg-dark-accent text-dark-bg font-semibold'
                        : 'bg-ink text-paper font-semibold'
                      : isDark
                        ? 'text-dark-text hover:bg-dark-panel'
                        : 'text-ink hover:bg-panel'
                  }`}
                >
                  <Eye className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                  <span>Inspect</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLeftViewModeChange('edit')}
                  aria-pressed={showEditor}
                  className={`inline-flex items-center gap-1 min-h-[40px] sm:min-h-[28px] rounded-[4px] px-2 py-0.5 font-mono text-xs transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isDark
                      ? 'focus-visible:outline-dark-accent'
                      : 'focus-visible:outline-accent'
                  } ${
                    showEditor
                      ? isDark
                        ? 'bg-dark-accent text-dark-bg font-semibold'
                        : 'bg-ink text-paper font-semibold'
                      : isDark
                        ? 'text-dark-text hover:bg-dark-panel'
                        : 'text-ink hover:bg-panel'
                  }`}
                >
                  <Edit3 className="h-3 w-3" strokeWidth={1.75} aria-hidden="true" />
                  <span>Edit</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative flex-1 flex flex-col">
          {showEditor ? (
            <textarea
              value={rawText}
              onChange={(e) => onTextChange(e.target.value)}
              aria-label="Raw input text"
              placeholder="Paste raw logs, support tickets, resumes, or CSV rows here. Processing stays 100% in browser memory."
              spellCheck={false}
              className={`flex-1 w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed focus:outline-none min-h-[340px] ${
                isDark
                  ? 'text-dark-text placeholder:text-dark-muted'
                  : 'text-ink placeholder:text-muted'
              }`}
            />
          ) : (
            <div
              className={`flex-1 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words overflow-auto max-h-[500px] ${
                isDark ? 'text-dark-text' : 'text-ink'
              }`}
            >
              {leftFragments.map((frag) => {
                if (frag.kind === 'plain') {
                  return <React.Fragment key={frag.key}>{frag.text}</React.Fragment>;
                }

                if (frag.kind === 'rejected') {
                  return (
                    <span
                      key={frag.key}
                      tabIndex={0}
                      className={`group relative inline-flex items-baseline gap-1 rounded-[4px] px-1 border-b-2 border-dashed cursor-help focus-visible:outline-2 focus-visible:outline-offset-1 ${
                        isDark
                          ? 'border-dark-accent text-dark-text focus-visible:outline-dark-accent'
                          : 'border-ink text-ink focus-visible:outline-accent'
                      }`}
                    >
                      <span>{frag.rejected.raw}</span>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-1 rounded-[4px] border border-dashed ${
                          isDark
                            ? 'border-dark-line text-dark-muted bg-dark-bg'
                            : 'border-muted text-muted bg-paper'
                        }`}
                      >
                        ignored
                      </span>
                      <span
                        role="tooltip"
                        className={`pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 absolute left-0 bottom-full mb-1.5 z-30 w-max max-w-xs rounded-[4px] border px-2.5 py-1.5 text-[11px] font-sans ${
                          isDark
                            ? 'bg-dark-bg border-dark-accent text-dark-text'
                            : 'bg-ink border-ink text-paper'
                        }`}
                      >
                        <span className="block font-semibold">
                          Ignored · False Positive
                        </span>
                        <span className="block opacity-85">
                          {frag.rejected.reason}
                        </span>
                      </span>
                    </span>
                  );
                }

                const theme = CATEGORY_THEME[frag.span.category];
                return (
                  <span
                    key={frag.key}
                    tabIndex={0}
                    className={`group relative inline-flex items-baseline gap-1 rounded-[4px] px-1 py-0.5 border border-ink font-medium cursor-help focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${theme.highlightBg}`}
                  >
                    <span>{frag.span.raw}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                      [{theme.shortTag}]
                    </span>
                    <span
                      role="tooltip"
                      className={`pointer-events-none opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150 absolute left-0 bottom-full mb-1.5 z-30 w-max max-w-xs rounded-[4px] border px-2.5 py-1.5 text-[11px] font-sans ${
                        isDark
                          ? 'bg-dark-bg border-dark-accent text-dark-text'
                          : 'bg-ink border-ink text-paper'
                      }`}
                    >
                      <span className="block font-semibold">
                        {theme.label} · {frag.span.validationBadge}
                      </span>
                      <span className="block font-mono opacity-85 mt-0.5">
                        → {frag.span.replacement}
                      </span>
                    </span>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 02 · SANITIZED OUTPUT */}
      <div
        className={`rounded-[4px] border-2 flex flex-col min-h-[380px] transition-colors duration-150 ${
          isDark
            ? 'lg:col-span-4 bg-dark-panel border-dark-accent'
            : 'bg-panel border-ink'
        }`}
      >
        <div
          className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${
            isDark ? 'border-dark-line' : 'border-ink'
          }`}
        >
          <div className="flex items-center gap-2">
            <h2
              className={`font-mono text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-dark-text' : 'text-ink'
              }`}
            >
              02 · SANITIZED OUTPUT
            </h2>
            <span
              className={`rounded-[4px] border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                isDark
                  ? 'bg-dark-bg border-dark-line text-dark-accent'
                  : 'bg-paper border-ink text-ink'
              }`}
            >
              {mode === 'full'
                ? 'Full mask'
                : mode === 'partial'
                  ? 'Partial'
                  : 'Pseudonymize'}
            </span>
          </div>

          <span
            className={`font-mono text-[11px] lg:hidden ${
              isDark ? 'text-dark-muted' : 'text-muted'
            }`}
          >
            Redacted preview
          </span>
        </div>

        <div
          className={`flex-1 p-4 font-mono text-[13px] leading-relaxed whitespace-pre-wrap break-words overflow-auto max-h-[500px] ${
            isDark ? 'text-dark-text' : 'text-ink'
          }`}
        >
          {!rawText ? (
            <div
              className={`h-full min-h-[300px] flex flex-col items-center justify-center text-center font-sans px-6 ${
                isDark ? 'text-dark-muted' : 'text-muted'
              }`}
            >
              <p className="text-sm font-medium">
                Sanitized output renders here in real time.
              </p>
              <p className="text-xs mt-1 font-mono">
                Select a sample, paste text, or drop a .txt / .csv file.
              </p>
            </div>
          ) : (
            result.outputSegments.map((seg, idx) => {
              if (!seg.isRedacted || !seg.category) {
                return (
                  <React.Fragment key={`out-${idx}`}>{seg.text}</React.Fragment>
                );
              }
              const theme = CATEGORY_THEME[seg.category];

              if (isDark) {
                return (
                  <span
                    key={`out-chip-${idx}`}
                    title={`${theme.label} pseudonym token`}
                    className={`inline-flex items-center rounded-[4px] border border-ink px-1.5 py-0.5 font-mono text-xs font-semibold ${theme.chipBg}`}
                  >
                    {seg.text}
                  </span>
                );
              }

              return (
                <span
                  key={`out-bar-${idx}`}
                  title={`${theme.label} redacted (${mode})`}
                  className="inline-block rounded-[4px] bg-ink text-paper px-1.5 py-0.5 font-mono text-xs font-medium"
                >
                  {seg.text}
                </span>
              );
            })
          )}
        </div>
      </div>

      {/* 03 · MAPPING KEY (.JSON) SIDE PANEL (PSEUDONYMIZE DARK MODE ONLY) */}
      {isDark && (
        <aside className="lg:col-span-4 rounded-[4px] border border-dark-line bg-dark-panel flex flex-col min-h-[380px]">
          <div className="px-4 py-2.5 border-b border-dark-line flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileKey2
                className="h-4 w-4 text-dark-accent"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-dark-text">
                03 · MAPPING KEY (.JSON)
              </h2>
            </div>

            <button
              type="button"
              onClick={onDownloadPseudonymKey}
              disabled={pseudonymEntries.length === 0}
              className="min-h-[44px] sm:min-h-[32px] rounded-[4px] border border-dark-accent bg-dark-accent text-dark-bg px-3 py-1 font-mono text-xs font-semibold transition-colors duration-150 cursor-pointer disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark-accent"
            >
              Export key .json
            </button>
          </div>

          <div className="p-3 border-b border-dark-line flex flex-wrap gap-1.5">
            {pseudonymEntries.length === 0 ? (
              <span className="font-mono text-xs text-dark-muted">
                No pseudonym tokens generated yet.
              </span>
            ) : (
              pseudonymEntries.map(([token, info]) => {
                const theme = CATEGORY_THEME[info.category];
                return (
                  <span
                    key={token}
                    className={`inline-flex items-center gap-1.5 rounded-[4px] border border-ink px-2 py-0.5 font-mono text-[11px] font-semibold ${theme.chipBg}`}
                  >
                    <span>{token}</span>
                    <span className="opacity-75">x{info.occurrences}</span>
                  </span>
                );
              })
            )}
          </div>

          <pre className="flex-1 p-4 font-mono text-[12px] leading-relaxed text-dark-text overflow-auto max-h-[420px]">
            {formattedMappingJson}
          </pre>
        </aside>
      )}
    </section>
  );
};
