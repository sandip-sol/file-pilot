import { useRef, useState } from 'react';
import { FileCheck2, LockKeyhole, ShieldCheck, Upload, CloudUpload } from 'lucide-react';

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    description?: string;
    hint?: string;
}

export const FileUploader = ({
    onFilesSelected,
    accept = '.pdf',
    multiple = false,
    description = "Drag & drop your files here",
    hint
}: FileUploaderProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [validationMessage, setValidationMessage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isAcceptedFile = (file: File) => {
        if (accept === '*') return true;

        return accept.split(',').some((entry) => {
            const rule = entry.trim().toLowerCase();
            if (!rule) return false;

            if (rule === 'image/*') {
                return file.type.startsWith('image/');
            }

            if (rule.endsWith('/*')) {
                const prefix = rule.slice(0, -1);
                return file.type.toLowerCase().startsWith(prefix);
            }

            if (rule.startsWith('.')) {
                return file.name.toLowerCase().endsWith(rule);
            }

            return file.type.toLowerCase() === rule;
        });
    };

    const acceptedLabel =
        accept === '.pdf'
            ? 'PDF files only'
            : accept === 'image/*'
                ? 'JPG, PNG, WebP'
                : accept;

    const getValidFiles = (files: File[]) => {
        const validFiles = files.filter(isAcceptedFile);
        if (validFiles.length === 0) {
            setValidationMessage(`Choose ${acceptedLabel.toLowerCase()} to continue.`);
            return [];
        }

        setValidationMessage(null);
        return multiple ? validFiles : [validFiles[0]];
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

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const files = Array.from(e.dataTransfer.files);
            const validFiles = getValidFiles(files);

            if (validFiles.length > 0) {
                onFilesSelected(validFiles);
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const validFiles = getValidFiles(Array.from(e.target.files));
            if (validFiles.length > 0) {
                onFilesSelected(validFiles);
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-3">
            <div
                className={`dropzone ${isDragging ? 'active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        fileInputRef.current?.click();
                    }
                }}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept={accept}
                    multiple={multiple}
                    onChange={handleFileInput}
                />

                <div className="flex flex-col items-center gap-4">
                    <div className={`dropzone-icon ${isDragging ? 'animate-float' : ''}`}>
                        {isDragging ? (
                            <CloudUpload className="w-8 h-8" />
                        ) : (
                            <Upload className="w-8 h-8" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold mb-1 text-[var(--text)]">{description}</h3>
                        <p className="text-sm text-[var(--text-muted)]">
                            or <span className="text-foreground font-medium">browse files</span> {multiple ? '(multiple allowed)' : ''}
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-[var(--text-muted)]">
                            <FileCheck2 className="h-3.5 w-3.5" />
                            {acceptedLabel}
                        </div>
                        <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs text-[var(--text-muted)]">
                            <LockKeyhole className="h-3.5 w-3.5" />
                            No upload
                        </div>
                    </div>
                </div>
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                    <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div>
                        <p className="font-medium text-foreground">Processed locally in your browser. No upload.</p>
                        {hint ? <p className="mt-1">{hint}</p> : null}
                    </div>
                </div>
            </div>
            <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <div className="min-w-0">
                        <p className="leading-relaxed">
                            Your file stays on your device. Review the settings and results, then download the output when you are ready.
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            {[
                                ['1.', 'Upload'],
                                ['2.', 'Settings'],
                                ['3.', 'Review'],
                                ['4.', 'Download'],
                            ].map(([number, label]) => (
                                <div key={label} className="flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-2 text-center font-medium text-muted-foreground">
                                    <span>{number}</span>
                                    <span>{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {validationMessage ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
                    {validationMessage}
                </div>
            ) : null}
        </div>
    );
};
