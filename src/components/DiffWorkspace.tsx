import React, { useMemo, useState } from 'react';
import {
  Check,
  ClipboardPaste,
  Copy,
  Download,
  Edit3,
  Eye,
  FileKey2,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import { PII_CATEGORIES } from '../engine/patterns';
import type {
  DetectedSpan,
  RedactionMode,
  RejectedCandidate,
  SanitizationResult,
} from '../engine/sanitizer';

interface DiffWorkspaceProps {
  rawText: string;
  mode: RedactionMode;
  result: SanitizationResult;
  leftViewMode: 'edit' | 'inspect';
  onLeftViewModeChange: (view: 'edit' | 'inspect') => void;
  onTextChange: (text: string) => void;
  onFileDropped: (file: File) => void;
  onDownloadOutput: () => void;
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
  onDownloadOutput,
  onDownloadPseudonymKey,
  onNotify,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Build non-overlapping fragments for the Left Pane (detected PII + Luhn-rejected safe IDs)
  const leftFragments = useMemo<LeftFragment[]>(() => {
    if (!rawText) return [];

    type Marker =
      | { start: number; end: number; type: 'pii'; span: DetectedSpan }
      | { start: number; end: number; type: 'rejected'; rejected: RejectedCandidate };

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

  const handleCopy = async () => {
    if (!result.sanitizedText) return;
    try {
      await navigator.clipboard.writeText(result.sanitizedText);
      setCopied(true);
      onNotify('Sanitized output copied to clipboard.');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      onNotify('Clipboard copy blocked by browser — use Download instead.');
    }
  };

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
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

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* LEFT PANE: ORIGINAL INPUT & HIGHLIGHT INSPECTOR */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`rounded-xl border bg-slate-900/75 flex flex-col min-h-[430px] transition-colors ${
            isDragging
              ? 'border-cyan-400 bg-cyan-950/20'
              : 'border-slate-800/90'
          }`}
        >
          <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 rounded-t-xl">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Original Input
              </h2>
              {rawText && (
                <span className="text-[11px] font-mono text-slate-400">
                  ({rawText.length.toLocaleString()} chars)
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 px-2 py-1 text-[11px] font-medium text-slate-200 transition-colors cursor-pointer"
                title="Paste from clipboard"
              >
                <ClipboardPaste className="h-3 w-3 text-cyan-400" />
                Paste
              </button>

              {rawText && (
                <div className="inline-flex rounded-md border border-slate-700 bg-slate-950 p-0.5">
                  <button
                    type="button"
                    onClick={() => onLeftViewModeChange('inspect')}
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                      !showEditor
                        ? 'bg-slate-800 text-emerald-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    Highlights
                  </button>
                  <button
                    type="button"
                    onClick={() => onLeftViewModeChange('edit')}
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                      showEditor
                        ? 'bg-slate-800 text-cyan-300'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Edit3 className="h-3 w-3" />
                    Edit Raw
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="relative flex-1 flex flex-col">
            {isDragging && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-xs rounded-b-xl border-2 border-dashed border-cyan-400">
                <UploadCloud className="h-10 w-10 text-cyan-400 mb-2" />
                <p className="text-sm font-semibold text-cyan-200">
                  Drop .txt or .csv file to sanitize locally
                </p>
              </div>
            )}

            {showEditor ? (
              <textarea
                value={rawText}
                onChange={(e) => onTextChange(e.target.value)}
                placeholder="Paste raw logs, support tickets, resumes, or drop a .txt / .csv file here...&#10;&#10;Everything stays 100% inside your browser memory (0 bytes uploaded)."
                spellCheck={false}
                className="flex-1 w-full resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-slate-200 placeholder:text-slate-500 focus:outline-none min-h-[380px]"
              />
            ) : (
              <div className="flex-1 p-4 font-mono text-[13px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words overflow-auto max-h-[540px]">
                {leftFragments.map((frag) => {
                  if (frag.kind === 'plain') {
                    return <React.Fragment key={frag.key}>{frag.text}</React.Fragment>;
                  }

                  if (frag.kind === 'rejected') {
                    return (
                      <span
                        key={frag.key}
                        className="group relative inline-block rounded px-1 py-0.2 bg-cyan-500/10 text-cyan-200 border-b border-dashed border-cyan-400/70 cursor-help"
                      >
                        {frag.rejected.raw}
                        <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 bottom-full mb-1.5 z-30 w-max max-w-xs rounded-lg border border-cyan-500/40 bg-slate-950 px-2.5 py-1.5 text-[11px] font-sans text-slate-200 shadow-xl">
                          <span className="block font-semibold text-cyan-300">
                            Safe Non-PII Numeric ID
                          </span>
                          <span className="block text-slate-400">
                            {frag.rejected.reason}
                          </span>
                        </span>
                      </span>
                    );
                  }

                  const meta = PII_CATEGORIES[frag.span.category];
                  return (
                    <span
                      key={frag.key}
                      className={`group relative inline-block rounded px-1 py-0.2 font-medium cursor-help ${meta.highlightClass}`}
                    >
                      {frag.span.raw}
                      <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 absolute left-0 bottom-full mb-1.5 z-30 w-max max-w-xs rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-[11px] font-sans text-slate-200 shadow-xl">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-100">
                          <span className={`h-2 w-2 rounded-full ${meta.dotClass}`} />
                          {meta.label}
                          <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.2 text-[10px] text-emerald-300">
                            {frag.span.validationBadge}
                          </span>
                        </span>
                        <span className="block text-slate-400 mt-0.5">
                          Becomes:{' '}
                          <code className="font-mono text-emerald-300">
                            {frag.span.replacement}
                          </code>
                        </span>
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANE: REAL-TIME SANITIZED OUTPUT */}
        <div className="rounded-xl border border-slate-800/90 bg-slate-900/75 flex flex-col min-h-[430px]">
          <div className="px-4 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/90 rounded-t-xl">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
                Sanitized Output
              </h2>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-medium text-slate-300 capitalize">
                {mode} mode
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleCopy}
                disabled={!result.sanitizedText}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none px-2.5 py-1 text-xs font-medium text-slate-100 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 text-slate-300" />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>

              <button
                type="button"
                onClick={onDownloadOutput}
                disabled={!result.sanitizedText}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:pointer-events-none px-2.5 py-1 text-xs font-semibold text-slate-950 transition-colors cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download
              </button>

              <button
                type="button"
                onClick={onDownloadPseudonymKey}
                disabled={mode !== 'pseudonym' || pseudonymEntries.length === 0}
                title={
                  mode !== 'pseudonym'
                    ? 'Switch to Consistent Pseudonym mode to export mapping key'
                    : 'Download Pseudonym Mapping Key (.json)'
                }
                className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/40 bg-violet-500/15 hover:bg-violet-500/25 disabled:opacity-35 disabled:pointer-events-none px-2.5 py-1 text-xs font-medium text-violet-200 transition-colors cursor-pointer"
              >
                <FileKey2 className="h-3.5 w-3.5" />
                Key (.json)
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 font-mono text-[13px] leading-relaxed text-slate-200 whitespace-pre-wrap break-words overflow-auto max-h-[540px]">
            {!rawText ? (
              <div className="h-full min-h-[340px] flex flex-col items-center justify-center text-center text-slate-500 font-sans px-6">
                <ShieldCheck className="h-10 w-10 text-slate-700 mb-3" />
                <p className="text-sm font-medium text-slate-400">
                  Your sanitized AI-safe document will appear here in real time
                </p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Load one of the 1-click sample payloads above, paste text, or drop a{' '}
                  <code className="text-slate-400">.txt</code> /{' '}
                  <code className="text-slate-400">.csv</code> file.
                </p>
              </div>
            ) : (
              result.outputSegments.map((seg, idx) => {
                if (!seg.isRedacted || !seg.category) {
                  return <React.Fragment key={`out-${idx}`}>{seg.text}</React.Fragment>;
                }
                const meta = PII_CATEGORIES[seg.category];
                return (
                  <span
                    key={`out-red-${idx}`}
                    title={`${meta.label} redacted (${mode} mode)`}
                    className={`inline-block rounded border px-1.5 py-0.2 font-semibold ${meta.badgeClass}`}
                  >
                    {seg.text}
                  </span>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Pseudonym Mapping Key Summary Strip */}
      {mode === 'pseudonym' && pseudonymEntries.length > 0 && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-300 mr-1">
              <FileKey2 className="h-3.5 w-3.5" />
              Active Pseudonym Key ({pseudonymEntries.length} unique tokens):
            </span>
            {pseudonymEntries.map(([token, info]) => (
              <span
                key={token}
                className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-slate-900/90 px-2 py-0.5 text-[11px] font-mono text-violet-200"
              >
                <span>{token}</span>
                <span className="text-slate-400">×{info.occurrences}</span>
              </span>
            ))}
          </div>
          <span className="text-[11px] text-slate-400">
            Deterministic per-document mapping keeps LLM context intact without leaking PII
          </span>
        </div>
      )}
    </section>
  );
};
