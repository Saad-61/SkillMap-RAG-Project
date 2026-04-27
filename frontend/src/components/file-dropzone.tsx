import { Upload } from "lucide-react";
import { useId, useRef, useState } from "react";
import { cn } from "../lib/utils";

type Props = {
  disabled?: boolean;
  onFileSelected: (file: File) => void;
  accept?: string;
  maxSizeBytes?: number;
};

function isSupportedFile(file: File) {
  const name = file.name.toLowerCase();
  return name.endsWith(".pdf") || name.endsWith(".docx");
}

export function FileDropzone({
  disabled,
  onFileSelected,
  accept = ".pdf,.docx",
  maxSizeBytes = 10 * 1024 * 1024,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chooseFile = () => inputRef.current?.click();

  const handleFile = (file: File | null) => {
    if (!file) return;
    setError(null);

    if (!isSupportedFile(file)) {
      setError("Please upload a PDF or DOCX file.");
      return;
    }
    if (file.size > maxSizeBytes) {
      setError("File is too large. Please keep it under 10MB.");
      return;
    }
    onFileSelected(file);
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={inputId}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white px-5 py-6 text-center shadow-soft transition-colors hover:bg-slate-50",
          dragActive && "border-indigo-400 bg-indigo-50/40",
          disabled && "cursor-not-allowed opacity-60 hover:bg-white",
        )}
        onClick={(e) => {
          if (disabled) e.preventDefault();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
          if (disabled) return;
          handleFile(e.dataTransfer.files?.[0] ?? null);
        }}
      >
        <div className="grid h-10 w-10 place-items-center rounded-full bg-indigo-600 text-white shadow-sm">
          <Upload className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="text-sm font-medium text-slate-900">
          Drop your CV here
        </div>
        <div className="text-xs text-slate-500">
          PDF or DOCX • up to 10MB
        </div>
        <div className="mt-2 text-xs text-indigo-700 underline-offset-4 group-hover:underline">
          Or browse files
        </div>
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="sr-only"
          accept={accept}
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {error ? (
        <div className="text-sm text-rose-700">{error}</div>
      ) : (
        <div className="text-xs text-slate-500">
          Tip: if preview looks wrong, re-upload the file.
        </div>
      )}
      <button
        type="button"
        className="sr-only"
        onClick={chooseFile}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}

