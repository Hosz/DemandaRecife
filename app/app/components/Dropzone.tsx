
"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { useToast } from "./ToastProvider";

const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".jpg", ".jpeg", ".png"];
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
    return "Formato não aceito. Envie um arquivo .csv, .xlsx, .jpg ou .png.";
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
    event.target.value = "";
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!disabled) setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
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
        className={`
          grid min-h-[115px] cursor-pointer place-items-center
          rounded-xl border border-dashed px-4 py-5 text-center
          transition duration-200
          ${
            isDragging
              ? "border-[#d6ff00] bg-[#d6ff00]/[0.06]"
              : "border-white/[0.10] bg-[#202020] hover:border-[#d6ff00]/50"
          }
          ${disabled ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <input
          type="file"
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleInputChange}
          disabled={disabled}
          className="sr-only"
        />

        <span className="grid size-7 place-items-center rounded-full bg-[#d6ff00]/10 text-[#d6ff00]">
          <svg
            width="15"
            height="15"
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

        <span className="mt-2.5 text-[11px] font-semibold text-white">
          {file ? file.name : "Selecione ou arraste um arquivo"}
        </span>

        <span className="mt-1 text-[9px] text-neutral-500">
          Excel, CSV, JPG ou PNG · até {maxSizeMB} MB
        </span>
      </label>

      {file && (
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-[#d6ff00]/20 bg-[#d6ff00]/[0.04] px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-semibold text-white">
              {file.name}
            </p>
            <p className="text-[9px] text-neutral-500">
              {formatSize(file.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onFileChange(null)}
            disabled={disabled}
            aria-label="Remover arquivo"
            className="shrink-0 text-neutral-400 transition hover:text-white"
          >
            <svg
              width="16"
              height="16"
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
