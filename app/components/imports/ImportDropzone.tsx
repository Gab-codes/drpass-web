import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Upload01Icon,
  File01Icon,
  Delete01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ImportFormat } from "@/types/import-types";

interface ImportDropzoneProps {
  format: ImportFormat;
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}

const ACCEPT_MAP: Record<ImportFormat, string> = {
  xlsx: ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  json: ".json,application/json",
};

const MAX_MB = 20;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export function ImportDropzone({
  format,
  file,
  onFile,
  disabled,
}: ImportDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);
  const [sizeError, setSizeError] = React.useState<string | null>(null);

  function handleFile(incoming: File | null) {
    setSizeError(null);
    if (!incoming) return;
    if (incoming.size > MAX_BYTES) {
      setSizeError(`File is too large. Maximum size is ${MAX_MB} MB.`);
      return;
    }
    onFile(incoming);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0] ?? null);
    // reset input so selecting the same file re-triggers onChange
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    handleFile(e.dataTransfer.files?.[0] ?? null);
  }

  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    if (!disabled) setDragging(true);
  }

  function onDragLeave() {
    setDragging(false);
  }

  const formatLabel = format.toUpperCase();

  return (
    <div className="space-y-2">
      {file ? (
        // ── Selected file display ─────────────────────────────────────────
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <HugeiconsIcon
                icon={File01Icon}
                className="h-4 w-4 text-primary"
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(0)} KB · {formatLabel}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onFile(null)}
            aria-label="Remove file"
            disabled={disabled}
          >
            <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        // ── Drop zone ─────────────────────────────────────────────────────
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`Upload ${formatLabel} file`}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => !disabled && inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              if (!disabled) inputRef.current?.click();
            }
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 transition-colors outline-none",
            dragging
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
            disabled && "pointer-events-none opacity-50",
          )}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              icon={Upload01Icon}
              className="h-5 w-5 text-muted-foreground"
            />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">
              Drop your {formatLabel} file here
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              or{" "}
              <span className="text-primary underline underline-offset-2">
                click to browse
              </span>
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_MAP[format]}
            className="sr-only"
            onChange={onInputChange}
            disabled={disabled}
            aria-hidden="true"
          />
        </div>
      )}

      {/* Constraints hint */}
      <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <HugeiconsIcon
          icon={InformationCircleIcon}
          className="mt-0.5 h-3.5 w-3.5 shrink-0"
        />
        <span>
          Accepts <strong>{formatLabel}</strong> files up to {MAX_MB} MB.{" "}
          {format === "xlsx"
            ? "Each sheet may represent a different year."
            : "Expects an array of question objects or { questions: [...] }."}
        </span>
      </div>

      {sizeError && (
        <p className="text-xs font-medium text-destructive">{sizeError}</p>
      )}
    </div>
  );
}
