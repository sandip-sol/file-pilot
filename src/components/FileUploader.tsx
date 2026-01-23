import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';

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
            // Basic client-side validation for type
            const validFiles = files.filter(file => {
                if (accept === '*') return true;
                // Simple check for extension or mime type
                return accept.split(',').some(ext => file.name.endsWith(ext.trim()) || file.type === ext.trim());
            });

            if (validFiles.length > 0) {
                onFilesSelected(validFiles);
            }
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFilesSelected(Array.from(e.target.files));
        }
        // Reset inputs so same file can be selected again
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragging
                ? 'border-[var(--primary)] bg-indigo-50'
                : 'border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--background)]'
                }`}
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
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDragging ? 'bg-indigo-100 text-[var(--primary)]' : 'bg-gray-100 text-[var(--text-muted)]'
                    }`}>
                    <Upload className="w-8 h-8" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-1">{description}</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                        or click to select files {multiple ? '(multiple allowed)' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
};
