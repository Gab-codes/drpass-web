import type { AiClassificationJobResults } from "@/types/questions";

function ConfidenceRow({
  label,
  count,
  total,
  colorClass,
}: {
  label: string;
  count: number;
  total: number;
  colorClass: string;
}) {
  const widthPct = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-32 shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted/50 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-8 text-right">
        {count}
      </span>
    </div>
  );
}

/**
 * "Confidence Distribution" card — share of AI suggestions per confidence band.
 * Renders nothing when there is no confidence data to show.
 */
export function ConfidenceBreakdown({
  confidence,
}: {
  confidence: AiClassificationJobResults["confidence"];
}) {
  const totalConfidenceCounts =
    confidence.high + confidence.medium + confidence.low;

  if (totalConfidenceCounts === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div>
        <h2 className="text-sm font-semibold">Confidence Distribution</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          These are AI suggestion scores — not official classifications. No
          topic is assigned until you accept below.
        </p>
      </div>

      <div className="space-y-2.5">
        <ConfidenceRow
          label="High (≥ 90%)"
          count={confidence.high}
          total={totalConfidenceCounts}
          colorClass="bg-success"
        />
        <ConfidenceRow
          label="Medium (80–89%)"
          count={confidence.medium}
          total={totalConfidenceCounts}
          colorClass="bg-info"
        />
        <ConfidenceRow
          label="Low (< 80%)"
          count={confidence.low}
          total={totalConfidenceCounts}
          colorClass="bg-warning"
        />
      </div>
    </div>
  );
}