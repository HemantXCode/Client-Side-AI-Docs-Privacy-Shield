import { useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Header } from './components/Header';
import { SampleBar } from './components/SampleBar';
import { AuditDashboard } from './components/AuditDashboard';
import { DiffWorkspace } from './components/DiffWorkspace';
import { SAMPLE_DATASETS, type SampleDataset } from './data/samples';
import type { PiiCategory } from './engine/patterns';
import {
  DEFAULT_ENABLED_CATEGORIES,
  sanitizeDocument,
  type RedactionMode,
} from './engine/sanitizer';
import {
  buildSanitizedFilename,
  downloadTextFile,
  readLocalTextFile,
} from './utils/fileHandlers';

export function App() {
  const [rawText, setRawText] = useState<string>(SAMPLE_DATASETS[1].content);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(
    SAMPLE_DATASETS[1].id
  );
  const [activeFilename, setActiveFilename] = useState<string | null>(
    SAMPLE_DATASETS[1].filename
  );
  const [mode, setMode] = useState<RedactionMode>('full');
  const [enabledCategories, setEnabledCategories] = useState<
    Record<PiiCategory, boolean>
  >(DEFAULT_ENABLED_CATEGORIES);
  const [enforceAadhaarVerhoeff, setEnforceAadhaarVerhoeff] = useState(false);
  const [leftViewMode, setLeftViewMode] = useState<'edit' | 'inspect'>('inspect');
  const [toast, setToast] = useState<{ type: 'info' | 'error'; text: string } | null>(
    null
  );

  const showToast = (text: string, type: 'info' | 'error' = 'info') => {
    setToast({ text, type });
    window.setTimeout(() => {
      setToast((current) => (current?.text === text ? null : current));
    }, 3200);
  };

  const result = useMemo(
    () =>
      sanitizeDocument(rawText, {
        mode,
        enabledCategories,
        enforceAadhaarVerhoeff,
      }),
    [rawText, mode, enabledCategories, enforceAadhaarVerhoeff]
  );

  const handleSelectSample = (sample: SampleDataset) => {
    setRawText(sample.content);
    setActiveSampleId(sample.id);
    setActiveFilename(sample.filename);
    setLeftViewMode('inspect');
    showToast(`Loaded "${sample.label}" sample locally.`);
  };

  const handleClear = () => {
    setRawText('');
    setActiveSampleId(null);
    setActiveFilename(null);
    setLeftViewMode('edit');
  };

  const handleTextChange = (text: string) => {
    setRawText(text);
    setActiveSampleId(null);
  };

  const handleFileSelected = async (file: File) => {
    try {
      const loaded = await readLocalTextFile(file);
      setRawText(loaded.content);
      setActiveSampleId(null);
      setActiveFilename(loaded.filename);
      setLeftViewMode('inspect');
      showToast(
        `Loaded "${loaded.filename}" (${(loaded.sizeBytes / 1024).toFixed(1)} KB) locally.`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unable to load file locally.';
      showToast(message, 'error');
    }
  };

  const handleToggleCategory = (category: PiiCategory) => {
    setEnabledCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const handleDownloadOutput = () => {
    if (!result.sanitizedText) return;
    const filename = buildSanitizedFilename(activeFilename);
    const mime = filename.endsWith('.csv')
      ? 'text/csv;charset=utf-8'
      : 'text/plain;charset=utf-8';
    downloadTextFile(filename, result.sanitizedText, mime);
    showToast(`Downloaded "${filename}".`);
  };

  const handleDownloadPseudonymKey = () => {
    if (mode !== 'pseudonym' || result.pseudonymKey.totalUniqueTokens === 0) {
      return;
    }
    const baseName = (activeFilename || 'document.txt').replace(/\.(txt|csv)$/i, '');
    const keyFilename = `${baseName}_pseudonym_key.json`;
    downloadTextFile(
      keyFilename,
      JSON.stringify(result.pseudonymKey, null, 2),
      'application/json;charset=utf-8'
    );
    showToast(`Exported "${keyFilename}".`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Header onFileSelected={handleFileSelected} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
        <SampleBar
          activeSampleId={activeSampleId}
          activeFilename={activeFilename}
          hasText={rawText.length > 0}
          onSelectSample={handleSelectSample}
          onClear={handleClear}
        />

        <AuditDashboard
          audit={result.audit}
          mode={mode}
          enabledCategories={enabledCategories}
          enforceAadhaarVerhoeff={enforceAadhaarVerhoeff}
          onModeChange={setMode}
          onToggleCategory={handleToggleCategory}
          onToggleAadhaarVerhoeff={() =>
            setEnforceAadhaarVerhoeff((prev) => !prev)
          }
        />

        <DiffWorkspace
          rawText={rawText}
          mode={mode}
          result={result}
          leftViewMode={leftViewMode}
          onLeftViewModeChange={setLeftViewMode}
          onTextChange={handleTextChange}
          onFileDropped={handleFileSelected}
          onDownloadOutput={handleDownloadOutput}
          onDownloadPseudonymKey={handleDownloadPseudonymKey}
          onNotify={(msg) => showToast(msg)}
        />
      </main>

      <footer className="border-t border-slate-900 py-3 px-4 text-center text-xs text-slate-500">
        SafePaste executes deterministically in browser memory • Zero API calls • Zero telemetry
      </footer>

      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-lg border px-3.5 py-2.5 text-xs font-medium shadow-2xl bg-slate-900/95 backdrop-blur-md border-slate-700 text-slate-100">
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}

export default App;
