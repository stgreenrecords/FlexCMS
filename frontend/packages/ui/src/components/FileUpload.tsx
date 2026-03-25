'use client';

import React, { useCallback, useRef, useState } from 'react';
import { cn } from '../lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FileUploadProps {
  /** Called when files are selected/dropped */
  onFiles?: (files: File[]) => void;
  /** Accepted MIME types or extensions (e.g., ".png,image/*") */
  accept?: string;
  /** Allow multiple file selection */
  multiple?: boolean;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Maximum number of files */
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
  /** Custom drag-over content */
  activeContent?: React.ReactNode;
  /** Dropzone content */
  children?: React.ReactNode;
}

export interface UploadedFile {
  file: File;
  preview?: string;
  error?: string;
  id: string;
}

let fileCounter = 0;

// ---------------------------------------------------------------------------
// FileUpload / Dropzone
// ---------------------------------------------------------------------------

export function FileUpload({
  onFiles,
  accept,
  multiple = false,
  maxSize,
  maxFiles,
  disabled = false,
  className,
  activeContent,
  children,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const inputRef                    = useRef<HTMLInputElement>(null);

  const validateAndEmit = useCallback((rawFiles: FileList | File[]) => {
    setError(null);
    const arr = Array.from(rawFiles);

    if (maxFiles && arr.length > maxFiles) {
      setError(`Maximum ${maxFiles} file${maxFiles === 1 ? '' : 's'} allowed.`);
      return;
    }

    const invalid = arr.filter((f) => maxSize && f.size > maxSize);
    if (invalid.length) {
      const mb = (maxSize! / 1024 / 1024).toFixed(1);
      setError(`File${invalid.length > 1 ? 's' : ''} exceed the ${mb} MB limit.`);
      return;
    }

    onFiles?.(arr);
  }, [maxSize, maxFiles, onFiles]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    validateAndEmit(e.dataTransfer.files);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) validateAndEmit(e.target.files);
    e.target.value = '';
  }

  function handleClick() {
    if (!disabled) inputRef.current?.click();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      inputRef.current?.click();
    }
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        aria-disabled={disabled}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'rounded-[var(--radius-md)] border-2 border-dashed',
          'p-8 text-center cursor-pointer transition-colors',
          'select-none',
          isDragging
            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
            : 'border-[var(--color-border)] bg-[var(--color-muted)]/30',
          'hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]',
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          className="sr-only"
          tabIndex={-1}
        />

        {isDragging && activeContent ? activeContent : (
          children ?? <DefaultDropzoneContent />
        )}
      </div>

      {error && (
        <p className="text-xs text-[var(--color-destructive)] flex items-center gap-1">
          <AlertIcon />
          {error}
        </p>
      )}
    </div>
  );
}

function DefaultDropzoneContent() {
  return (
    <>
      <UploadIcon />
      <p className="mt-3 text-sm font-medium text-[var(--color-foreground)]">
        Drag &amp; drop files here
      </p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        or <span className="text-[var(--color-primary)] hover:underline">browse</span> to select
      </p>
    </>
  );
}

// ---------------------------------------------------------------------------
// FileUploadList — shows selected files with remove button
// ---------------------------------------------------------------------------

export interface FileUploadListProps {
  files: UploadedFile[];
  onRemove?: (id: string) => void;
  className?: string;
}

export function FileUploadList({ files, onRemove, className }: FileUploadListProps) {
  if (!files.length) return null;

  return (
    <ul className={cn('space-y-2', className)}>
      {files.map((uf) => (
        <li
          key={uf.id}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)]',
            'bg-[var(--color-muted)]/50 border border-[var(--color-border)]',
            'text-sm',
            uf.error && 'border-[var(--color-destructive)]/50 bg-[var(--color-destructive)]/5',
          )}
        >
          {/* File icon */}
          <span className="shrink-0 text-[var(--color-muted-foreground)]">
            <FileIcon />
          </span>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="truncate font-medium text-[var(--color-foreground)]">{uf.file.name}</p>
            {uf.error ? (
              <p className="text-[0.7rem] text-[var(--color-destructive)]">{uf.error}</p>
            ) : (
              <p className="text-[0.7rem] text-[var(--color-muted-foreground)]">
                {formatBytes(uf.file.size)}
              </p>
            )}
          </div>

          {/* Remove */}
          {onRemove && (
            <button
              onClick={() => onRemove(uf.id)}
              aria-label={`Remove ${uf.file.name}`}
              className={cn(
                'shrink-0 h-6 w-6 flex items-center justify-center rounded',
                'text-[var(--color-muted-foreground)]',
                'hover:bg-[var(--color-accent)] hover:text-[var(--color-accent-foreground)]',
                'transition-colors',
              )}
            >
              <XIcon />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

// ---------------------------------------------------------------------------
// useFileUpload hook — manages UploadedFile list state
// ---------------------------------------------------------------------------

export function useFileUpload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  function addFiles(rawFiles: File[]) {
    const next = rawFiles.map((file) => {
      fileCounter++;
      const id      = `fu-${fileCounter}`;
      const preview = file.type.startsWith('image/')
        ? URL.createObjectURL(file)
        : undefined;
      return { file, preview, id };
    });
    setFiles((prev) => [...prev, ...next]);
  }

  function removeFile(id: string) {
    setFiles((prev) => {
      const toRemove = prev.find((f) => f.id === id);
      if (toRemove?.preview) URL.revokeObjectURL(toRemove.preview);
      return prev.filter((f) => f.id !== id);
    });
  }

  function clear() {
    files.forEach((f) => { if (f.preview) URL.revokeObjectURL(f.preview); });
    setFiles([]);
  }

  return { files, addFiles, removeFile, clear };
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function UploadIcon() {
  return (
    <svg className="h-10 w-10 text-[var(--color-muted-foreground)]"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="h-4 w-4"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-3 w-3"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="h-3 w-3"
      xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}
