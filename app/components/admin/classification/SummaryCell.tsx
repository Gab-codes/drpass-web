/**
 * Compact statistic cell (label + value + optional note).
 *
 * Shared by the classification summary and the failed/cancelled view so both
 * surfaces render job outcome counters identically.
 */
export function SummaryCell({
  label,
  value,
  note,
  highlight,
}: {
  label: string;
  value: number;
  note?: string;
  highlight?: "success" | "info" | "warning" | "destructive";
}) {
  const numColor =
    highlight === "success"
      ? "text-success"
      : highlight === "info"
        ? "text-info"
        : highlight === "warning"
          ? "text-warning"
          : highlight === "destructive"
            ? "text-destructive"
            : "text-foreground";

  return (
    <div className="rounded-lg bg-muted/30 px-3 py-3 text-center">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${numColor}`}>{value}</p>
      {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
    </div>
  );
}