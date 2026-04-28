import type { ReactNode } from "react";
import { ratingColor, ratingLabel } from "@/lib/format";
import type { MetricRating } from "@/lib/types";

export interface MetricCardProps {
  label: string;
  value: ReactNode;
  rating?: MetricRating;
  hint?: string;
  compact?: boolean;
}

export function MetricCard({
  label,
  value,
  rating,
  hint,
  compact,
}: MetricCardProps) {
  const color = rating ? ratingColor(rating) : "#5b8cff";
  return (
    <div
      className="metric-card"
      style={{ borderLeftColor: color }}
      data-compact={compact ? "true" : "false"}
    >
      <div className="metric-card__label">{label}</div>
      <div className="metric-card__value">{value}</div>
      <div className="metric-card__footer">
        {rating && (
          <span className="metric-card__chip" style={{ color }}>
            {ratingLabel(rating)}
          </span>
        )}
        {hint && <span className="metric-card__hint">{hint}</span>}
      </div>
    </div>
  );
}
