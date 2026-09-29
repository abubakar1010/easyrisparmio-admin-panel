import { useId } from "react";
import { cn } from "../../utils/cn";

const W = 100;
const H = 32;
const PAD = 3;

/**
 * Trend line with a soft fill under it. Renders nothing without data — a
 * made-up curve next to a real number reads as a real trend.
 */
export function MiniSparkline({
  positive,
  data,
  className,
}: {
  positive?: boolean;
  data?: number[];
  className?: string;
}) {
  const gradientId = useId();
  if (!data || data.length < 2) return null;

  const points = toPoints(data);
  const line = points.map(([x, y]) => `${x},${y}`).join(" ");
  const area = `M${points[0][0]},${H} L${line.replace(/ /g, " L")} L${points[points.length - 1][0]},${H} Z`;
  const color = positive ? "#10B981" : "#EF4444";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className={cn("h-10 w-full", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
        points={line}
      />
    </svg>
  );
}

function toPoints(data: number[]): Array<[number, number]> {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const h = H - 2 * PAD;
  return data.map((v, i) => [
    Number(((i / (data.length - 1)) * W).toFixed(1)),
    Number((PAD + h - ((v - min) / range) * h).toFixed(1)),
  ]);
}
