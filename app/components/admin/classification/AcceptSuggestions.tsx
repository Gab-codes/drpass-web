import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { AiClassificationJobResults } from "@/types/questions";

/**
 * Compute how many suggestions would be accepted at a given threshold from the
 * confidence distribution returned by getJobResults.
 * The backend buckets are: high >= 0.9, medium 0.8–0.89, low < 0.8.
 * We use these to approximate the preview count without a network call.
 */
function estimateAboveThreshold(
  confidence: AiClassificationJobResults["confidence"],
  threshold: number, // 0..1
): number {
  if (threshold < 0.8)
    return confidence.high + confidence.medium + confidence.low;
  if (threshold < 0.9) return confidence.high + confidence.medium;
  return confidence.high;
}

/**
 * "What can I safely accept?" card — the confidence threshold slider plus the
 * two acceptance actions.
 *
 * Owns only the threshold UI state; the accept mutations, their toasts and the
 * post-accept refresh live in the route.
 * Renders nothing when the job produced no suggestions.
 */
export function AcceptSuggestions({
  results,
  onAcceptAll,
  onAcceptThreshold,
  isAcceptingAll,
  isAcceptingThreshold,
}: {
  results: AiClassificationJobResults;
  onAcceptAll: () => void;
  onAcceptThreshold: (minConfidence: number) => void;
  isAcceptingAll: boolean;
  isAcceptingThreshold: boolean;
}) {
  // Threshold: 0–100 integer for display, converted to 0..1 for the API.
  const [threshold, setThreshold] = React.useState(80);

  const thresholdFraction = threshold / 100;
  const previewCount = estimateAboveThreshold(
    results.confidence,
    thresholdFraction,
  );
  const isBusy = isAcceptingAll || isAcceptingThreshold;

  if (results.suggested <= 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div>
        <h2 className="text-sm font-semibold">Accept Suggestions</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Accepting converts AI suggestions into{" "}
          <strong>official canonical classifications</strong>. This action
          is recorded under your account.
        </p>
      </div>

      {/* Threshold slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="confidence-threshold" className="text-sm">
            Minimum Confidence Threshold
          </Label>
          <span className="text-sm font-semibold text-primary tabular-nums">
            {threshold}%
          </span>
        </div>
        <input
          id="confidence-threshold"
          type="range"
          min={0}
          max={100}
          step={5}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0% (all)</span>
          <span>100% (only exact)</span>
        </div>
        <p className="text-sm text-center rounded-lg bg-accent px-4 py-2 font-medium text-accent-foreground">
          {previewCount} suggestion{previewCount !== 1 ? "s" : ""} will be
          accepted at ≥{threshold}% confidence
        </p>
      </div>

      {/* Accept actions */}
      <div className="flex flex-col sm:flex-row gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onAcceptAll}
          disabled={isBusy}
          className="gap-2"
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" />
          {isAcceptingAll ? "Accepting…" : "Accept All Suggestions"}
        </Button>
        <Button
          size="sm"
          onClick={() => onAcceptThreshold(thresholdFraction)}
          disabled={isBusy || previewCount === 0}
          className="gap-2"
        >
          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" />
          {isAcceptingThreshold ? "Accepting…" : `Accept ≥ ${threshold}%`}
        </Button>
      </div>
    </div>
  );
}