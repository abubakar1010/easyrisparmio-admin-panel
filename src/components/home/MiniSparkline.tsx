/** Trend line for KPI cards — renders real data when available, decorative fallback otherwise */
export function MiniSparkline({ positive, data }: { positive?: boolean; data?: number[] }) {
  const points = data?.length ? dataToPoints(data) : (positive ? "0,14 20,10 40,12 60,6 80,8 100,4" : "0,6 20,10 40,8 60,14 80,12 100,14");
  return (
    <svg viewBox="0 0 100 18" className="h-8 w-20 shrink-0" aria-hidden>
      <polyline
        fill="none"
        stroke={positive ? "#22C55E" : "#EF4444"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function dataToPoints(data: number[]): string {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pad = 2;
  const h = 18 - 2 * pad;

  return data
    .map((v, i) => {
      const x = data.length > 1 ? (i / (data.length - 1)) * 100 : 50;
      const y = pad + h - ((v - min) / range) * h;
      return `${Math.round(x)},${y.toFixed(1)}`;
    })
    .join(" ");
}
