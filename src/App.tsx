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

  const isDark = mode === 'pseudonym';

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

  const handleCopyOutput = async (): Promise<boolean> => {
    if (!result.sanitizedText) return false;
    try {
      await navigator.clipboard.writeText(result.sanitizedText);
      showToast('Sanitized output copied to clipboard.');
      return true;
    } catch {
      showToast('Clipboard copy blocked by browser — use Download instead.', 'error');
      return false;
    }
  };

  const outputFilename = buildSanitizedFilename(activeFilename);

  const handleDownloadOutput = () => {
    if (!result.sanitizedText) return;
    const mime = outputFilename.endsWith('.csv')
      ? 'text/csv;charset=utf-8'
      : 'text/plain;charset=utf-8';
    downloadTextFile(outputFilename, result.sanitizedText, mime);
    showToast(`Downloaded "${outputFilename}".`);
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
    <div
      className={`min-h-screen flex flex-col transition-colors duration-150 ${
        isDark
          ? 'theme-dark bg-dark-bg text-dark-text'
          : 'bg-paper text-ink'
      }`}
    >
      <Header onFileSelected={handleFileSelected} isDark={isDark} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 space-y-4">
        <SampleBar
          activeSampleId={activeSampleId}
          activeFilename={activeFilename}
          hasText={rawText.length > 0}
          enabledCategories={enabledCategories}
          countsByCategory={result.audit.countsByCategory}
          enforceAadhaarVerhoeff={enforceAadhaarVerhoeff}
          isDark={isDark}
          onSelectSample={handleSelectSample}
          onClear={handleClear}
          onFileSelected={handleFileSelected}
          onToggleCategory={handleToggleCategory}
          onToggleAadhaarVerhoeff={() =>
            setEnforceAadhaarVerhoeff((prev) => !prev)
          }
        />

        {/* Mobile Scan Result Card */}
        <AuditDashboard
          audit={result.audit}
          mode={mode}
          hasOutput={Boolean(result.sanitizedText)}
          outputFilename={outputFilename}
          variant="mobile-summary"
          onModeChange={setMode}
          onCopyOutput={handleCopyOutput}
          onDownloadOutput={handleDownloadOutput}
        />

        <DiffWorkspace
          rawText={rawText}
          mode={mode}
          result={result}
          leftViewMode={leftViewMode}
          onLeftViewModeChange={setLeftViewMode}
          onTextChange={handleTextChange}
          onFileDropped={handleFileSelected}
          onDownloadPseudonymKey={handleDownloadPseudonymKey}
          onNotify={(msg) => showToast(msg)}
        />

        {/* Desktop Footer Bar & Mobile Action Bar */}
        <AuditDashboard
          audit={result.audit}
          mode={mode}
          hasOutput={Boolean(result.sanitizedText)}
          outputFilename={outputFilename}
          variant="footer"
          onModeChange={setMode}
          onCopyOutput={handleCopyOutput}
          onDownloadOutput={handleDownloadOutput}
        />
      </main>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-[4px] border px-3.5 py-2.5 font-mono text-xs ${
            isDark
              ? 'bg-dark-panel border-dark-accent text-dark-text'
              : 'bg-ink border-ink text-paper'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden="true" />
          )}
          <span>{toast.text}</span>
        </div>
      )}
    </div>
  );
}

export default App;
