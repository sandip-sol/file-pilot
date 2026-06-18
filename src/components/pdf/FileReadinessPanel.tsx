import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Eye, FileText, Loader2, LockKeyhole } from 'lucide-react';
import { openPdfDocument, renderPdfPagePreview } from '../../utils/pdf/rendering';
import { isBrowserMemoryError, isPdfPasswordError } from '../../utils/pdf/errorMessages';

type DiagnosticStatus = 'checking' | 'ready' | 'warning' | 'blocked';

export interface FileDiagnostic {
  id: string;
  fileName: string;
  sizeLabel: string;
  sizeBytes: number;
  status: DiagnosticStatus;
  pageCount?: number;
  previewUrl?: string;
  limitation?: string;
  recovery?: string;
}

interface FileReadinessPanelProps {
  files: File[];
  showPreview?: boolean;
  maxPreviewFiles?: number;
  onDiagnostics?: (items: FileDiagnostic[]) => void;
}

const LARGE_FILE_BYTES = 100 * 1024 * 1024;

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const getFileId = (file: File, index: number) => `${file.name}-${file.size}-${file.lastModified}-${index}`;

const getStatusMeta = (status: DiagnosticStatus) => {
  if (status === 'ready') {
    return {
      label: 'Ready',
      className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    };
  }

  if (status === 'warning') {
    return {
      label: 'Check limits',
      className: 'border-amber-200 bg-amber-50 text-amber-700',
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    };
  }

  if (status === 'blocked') {
    return {
      label: 'Needs attention',
      className: 'border-red-200 bg-red-50 text-red-700',
      icon: <LockKeyhole className="h-3.5 w-3.5" />,
    };
  }

  return {
    label: 'Checking',
    className: 'border-border bg-muted text-muted-foreground',
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
  };
};

export const FileReadinessPanel = ({
  files,
  showPreview = false,
  maxPreviewFiles = 1,
  onDiagnostics,
}: FileReadinessPanelProps) => {
  const [items, setItems] = useState<FileDiagnostic[]>([]);
  const filesKey = useMemo(() => files.map((file, index) => getFileId(file, index)).join('|'), [files]);

  useEffect(() => {
    let cancelled = false;
    const previewUrls: string[] = [];
    const initialItems = files.map((file, index) => ({
      id: getFileId(file, index),
      fileName: file.name,
      sizeLabel: formatFileSize(file.size),
      sizeBytes: file.size,
      status: 'checking' as const,
    }));

    setItems(initialItems);

    const inspectFiles = async () => {
      const nextItems: FileDiagnostic[] = [];

      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const baseItem = initialItems[index];

        try {
          const { pdf, pageCount } = await openPdfDocument(file);
          let previewUrl: string | undefined;
          let previewWarning: Pick<FileDiagnostic, 'limitation' | 'recovery'> = {};

          if (showPreview && index < maxPreviewFiles) {
            try {
              const preview = await renderPdfPagePreview(pdf, 1, 0.32);
              previewUrl = preview.imageUrl;
              previewUrls.push(preview.imageUrl);
            } catch (error) {
              console.error(error);
              previewWarning = {
                limitation: 'Preview unavailable',
                recovery: 'The file opened, but the first page could not be previewed in this browser tab.',
              };
            }
          }

          void pdf.destroy();

          const isLargeFile = file.size > LARGE_FILE_BYTES;
          const diagnostic: FileDiagnostic = {
            ...baseItem,
            status: isLargeFile || previewWarning.limitation ? 'warning' : 'ready',
            pageCount,
            previewUrl,
            limitation: isLargeFile ? 'Large browser workload' : previewWarning.limitation,
            recovery: isLargeFile
              ? 'Large PDFs can exhaust browser memory. Close other tabs or split the file first.'
              : previewWarning.recovery,
          };

          nextItems.push(diagnostic);
        } catch (error) {
          console.error(error);

          if (isPdfPasswordError(error)) {
            nextItems.push({
              ...baseItem,
              status: 'blocked',
              limitation: 'Password-protected PDF',
              recovery: 'Try unlocking it first, then upload the unlocked copy.',
            });
          } else if (isBrowserMemoryError(error)) {
            nextItems.push({
              ...baseItem,
              status: 'blocked',
              limitation: 'Browser memory limit',
              recovery: 'This file is too large for your browser memory. Try a smaller file or split it first.',
            });
          } else {
            nextItems.push({
              ...baseItem,
              status: 'blocked',
              limitation: 'Could not read PDF',
              recovery: 'Try Repair PDF or export a fresh copy, then upload it again.',
            });
          }
        }

        if (!cancelled) {
          setItems([...nextItems, ...initialItems.slice(index + 1)]);
        }
      }

      if (!cancelled) {
        onDiagnostics?.(nextItems);
      }
    };

    if (files.length > 0) {
      void inspectFiles();
    }

    return () => {
      cancelled = true;
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files, filesKey, maxPreviewFiles, onDiagnostics, showPreview]);

  if (files.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-[var(--text)]">File readiness</h3>
          <p className="text-sm text-[var(--text-muted)]">Check the document before choosing settings or downloading.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <Eye className="h-3.5 w-3.5" />
          Local preview
        </div>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const status = getStatusMeta(item.status);

          return (
            <div key={item.id} className="rounded-lg border border-border bg-card p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                {showPreview && item.previewUrl ? (
                  <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-white">
                    <img src={item.previewUrl} alt={`Preview of ${item.fileName}`} className="max-h-full max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    {item.status === 'checking' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--text)]">{item.fileName}</p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {item.sizeLabel}
                        {typeof item.pageCount === 'number' ? ` - ${item.pageCount} page${item.pageCount === 1 ? '' : 's'}` : ''}
                      </p>
                    </div>
                    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>

                  {item.limitation || item.recovery ? (
                    <div className="mt-3 rounded-md border border-border bg-background px-3 py-2 text-xs text-muted-foreground">
                      {item.limitation ? <p className="font-medium text-[var(--text)]">{item.limitation}</p> : null}
                      {item.recovery ? <p className="mt-1">{item.recovery}</p> : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
