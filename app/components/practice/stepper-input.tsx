"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface StepperInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  suffix?: string;
  hint?: string;
  error?: string;
  disabled?: boolean;
}

// Accessible numeric stepper: − / free-typed input / + with hard clamping.
export function StepperInput({
  id,
  label,
  value,
  onChange,
  min,
  max,
  suffix,
  hint,
  error,
  disabled,
}: StepperInputProps) {
  const [raw, setRaw] = useState<string>(String(value));

  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  const commit = (rawValue: string) => {
    const parsed = Number.parseInt(rawValue, 10);
    if (Number.isNaN(parsed)) {
      setRaw(String(value));
      return;
    }
    const next = clamp(parsed);
    setRaw(String(next));
    if (next !== value) onChange(next);
  };

  const step = (delta: number) => {
    const next = clamp(value + delta);
    setRaw(String(next));
    onChange(next);
  };

  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="text-sm font-medium text-foreground"
      >
        {label}
      </label>
      <div
        className={cn(
          "flex items-stretch h-11 rounded-xl border border-border bg-input/30 overflow-hidden transition-colors",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          error && "border-destructive focus-within:ring-destructive/20",
          disabled && "opacity-50 pointer-events-none"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || value <= min}
          onClick={() => step(-1)}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="rounded-none hover:bg-muted focus-visible:ring-inset"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
          </svg>
        </Button>

        <div className="relative flex-1 min-w-0">
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={raw}
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowUp") {
                e.preventDefault();
                step(1);
              } else if (e.key === "ArrowDown") {
                e.preventDefault();
                step(-1);
              } else if (e.key === "Enter") {
                commit((e.target as HTMLInputElement).value);
              }
            }}
            className="h-full rounded-none border-0 bg-transparent text-center font-medium tabular-nums focus-visible:ring-0 focus-visible:border-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {suffix && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground"
            >
              {suffix}
            </span>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled || value >= max}
          onClick={() => step(1)}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="rounded-none hover:bg-muted focus-visible:ring-inset"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
          </svg>
        </Button>
      </div>

      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs text-destructive"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
