/** Lightweight decorative trend line for KPI cards */
export function MiniSparkline({ positive }: { positive?: boolean }) {
  const points = positive ? "0,14 20,10 40,12 60,6 80,8 100,4" : "0,6 20,10 40,8 60,14 80,12 100,14";
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
