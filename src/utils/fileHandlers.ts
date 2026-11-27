const ALLOWED_EXTENSIONS = ['.txt', '.csv'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB client-side safety guard

export interface LoadedFileResult {
  filename: string;
  content: string;
  sizeBytes: number;
}

/**
 * Validates and reads a local .txt or .csv file strictly via the browser FileReader API.
 */
export function readLocalTextFile(file: File): Promise<LoadedFileResult> {
  return new Promise((resolve, reject) => {
    const lowerName = file.name.toLowerCase();
    const hasValidExt = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));

    if (!hasValidExt) {
      reject(
        new Error(
          `Unsupported file "${file.name}". Only .txt and .csv files are accepted.`
        )
      );
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      reject(
        new Error(
          `File "${file.name}" exceeds the 5 MB in-browser processing limit.`
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      resolve({
        filename: file.name,
        content,
        sizeBytes: file.size,
      });
    };
    reader.onerror = () => {
      reject(new Error(`Failed to read "${file.name}" locally.`));
    };
    reader.readAsText(file);
  });
}

/**
 * Triggers a local Blob download without making any network requests.
 */
export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = 'text/plain;charset=utf-8'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

/**
 * Builds the sanitized download filename preserving the original extension (.txt or .csv).
 */
export function buildSanitizedFilename(originalFilename: string | null): string {
  if (!originalFilename) {
    return 'sanitized_document.txt';
  }
  const clean = originalFilename.replace(/^sanitized_/, '');
  return `sanitized_${clean}`;
}
