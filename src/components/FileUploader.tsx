import { useRef, useState } from 'react';
import { Upload, CloudUpload } from 'lucide-react';

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    description?: string;
}

export const FileUploader = ({
    onFilesSelected,
    accept = '.pdf',
    multiple = false,
    description = "Drag & drop your files here"
}: FileUploaderProps) => {
    const [isDragging, setIsDragging] = useState(false);
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
            const validFiles = files.filter(isAcceptedFile);

            if (validFiles.length > 0) {
                onFilesSelected(validFiles);
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div
            className={`dropzone ${isDragging ? 'active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
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
                <div className="text-xs text-[var(--text-muted)] mt-2 bg-muted px-3 py-1 rounded-full">
                    {accept === '.pdf' ? 'PDF files only' : accept === 'image/*' ? 'JPG, PNG, WebP' : accept}
                </div>
            </div>
        </div>
    );
};
