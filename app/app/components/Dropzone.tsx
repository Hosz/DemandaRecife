"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { useToast } from "./ToastProvider";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx"];
const DEFAULT_MAX_SIZE_MB = 10;

type DropzoneProps = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  maxSizeMB?: number;
  disabled?: boolean;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File, maxSizeMB: number): string | null {
  const name = file.name.toLowerCase();
  const hasValidExtension = ACCEPTED_EXTENSIONS.some((extension) =>
    name.endsWith(extension),
  );

  if (!hasValidExtension) {
    return "Formato não aceito. Envie um arquivo .csv ou .xlsx.";
  }

  if (file.size === 0) {
    return "O arquivo está vazio.";
  }

  if (file.size > maxSizeMB * 1024 * 1024) {
    return `O arquivo passa do limite de ${maxSizeMB} MB.`;
  }

  return null;
}

export function Dropzone({
  file,
  onFileChange,
  maxSizeMB = DEFAULT_MAX_SIZE_MB,
  disabled = false,
}: DropzoneProps) {
  const { showToast } = useToast();
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      showToast("error", "Envie um arquivo por vez.");
      return;
    }

    const selected = files[0];
    const error = validateFile(selected, maxSizeMB);

    if (error) {
      showToast("error", error);
      return;
    }

    onFileChange(selected);
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFiles(event.target.files);
    // permite escolher o mesmo arquivo de novo depois de remover
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    // ignora o "leave" que acontece ao passar por cima de elementos filhos
    if (event.currentTarget.contains(event.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    handleFiles(event.dataTransfer.files);
  }

  return (
    <div>
      <label
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`grid cursor-pointer place-items-center rounded-2xl border border-dashed px-6 py-10 text-center transition focus-within:border-acid ${
          isDragging
            ? "border-acid bg-acid/[0.06]"
            : "border-white/20 bg-white/[0.025] hover:border-acid/70 hover:bg-acid/[0.03]"
        } ${disabled ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />

        <span className="grid size-12 place-items-center rounded-full bg-acid/10 text-acid">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="m17 8-5-5-5 5" />
            <path d="M12 3v12" />
          </svg>
        </span>

        <span className="mt-4 font-display text-base font-semibold">
          Selecione ou arraste um arquivo
        </span>
        <span className="mt-2 text-xs text-muted">
          CSV ou Excel (.csv, .xlsx) · até {maxSizeMB} MB
        </span>
      </label>

      {file && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-acid/30 bg-acid/[0.05] px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {file.name}
            </p>
            <p className="text-xs text-muted">{formatSize(file.size)}</p>
          </div>

          <button
            type="button"
            onClick={() => onFileChange(null)}
            disabled={disabled}
            aria-label="Remover arquivo"
            className="shrink-0 text-muted transition hover:text-white"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}