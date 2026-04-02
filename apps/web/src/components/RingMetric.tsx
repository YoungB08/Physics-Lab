export function RingMetric({ value, total, label }: { value: number; total: number; label: string }) {
  const safeTotal = Math.max(total, 1);
  const pct = Math.max(0, Math.min(100, Math.round((value / safeTotal) * 100)));
  return (
    <div className="ring-card">
      <div className="ring" style={{ ['--pct' as any]: `${pct}%` }}>
        <div className="ring-inner">{pct}%</div>
      </div>
      <div>
        <div className="ring-label">{label}</div>
        <div className="muted">{value} / {safeTotal}</div>
      </div>
    </div>
  );
}
