import { RotateCcw, RotateCw, Trash2, GripVertical } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import type { PdfPagePreview } from '../../utils/pdf/types';

interface PdfPageThumbnailProps {
  preview?: PdfPagePreview;
  pageNumber: number;
  displayIndex: number;
  rotation: number;
  selected: boolean;
  onToggleSelect: () => void;
  onRotateLeft?: () => void;
  onRotateRight?: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop?: () => void;
  onDelete?: () => void;
}

export const PdfPageThumbnail = ({
  preview,
  pageNumber,
  displayIndex,
  rotation,
  selected,
  onToggleSelect,
  onRotateLeft,
  onRotateRight,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
}: PdfPageThumbnailProps) => (
  <div
    className={`rounded-2xl border bg-card p-3 shadow-sm transition-colors ${selected ? 'border-foreground' : 'border-border'}`}
    draggable={draggable}
    onDragStart={onDragStart}
    onDragOver={onDragOver}
    onDrop={onDrop}
  >
    <div className="mb-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        {draggable ? <GripVertical className="h-4 w-4" /> : null}
        <span>Page {pageNumber}</span>
      </div>
      <span>#{displayIndex}</span>
    </div>

    <div className="relative flex aspect-[3/4] items-center justify-center overflow-hidden rounded-xl border border-border bg-white">
      {preview ? (
        <img
          src={preview.imageUrl}
          alt={`PDF page ${pageNumber}`}
          className="max-h-full max-w-full object-contain transition-transform"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
      ) : (
        <div className="text-sm text-muted-foreground">Rendering preview...</div>
      )}
    </div>

    <div className="mt-3 flex items-center justify-between gap-2">
      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Checkbox checked={selected} onCheckedChange={onToggleSelect} />
        Select
      </label>
      <div className="flex items-center gap-1">
        {onRotateLeft ? (
          <button type="button" className="rounded-lg p-2 hover:bg-muted" onClick={onRotateLeft} title="Rotate left">
            <RotateCcw className="h-4 w-4" />
          </button>
        ) : null}
        {onRotateRight ? (
          <button type="button" className="rounded-lg p-2 hover:bg-muted" onClick={onRotateRight} title="Rotate right">
            <RotateCw className="h-4 w-4" />
          </button>
        ) : null}
        {onDelete ? (
          <button
            type="button"
            className="rounded-lg p-2 text-muted-foreground hover:bg-[var(--error-light)] hover:text-[var(--error)]"
            onClick={onDelete}
            title="Delete page"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  </div>
);
