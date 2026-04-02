export function AreaTrend({ items, height = 180 }: { items: { label: string; value: number }[]; height?: number }) {
  const width = 520;
  const values = items.map((item) => item.value);
  const max = Math.max(...values, 1);
  const points = items.map((item, index) => {
    const x = items.length === 1 ? width / 2 : (index / (items.length - 1)) * (width - 40) + 20;
    const y = height - 25 - (item.value / max) * (height - 60);
    return { ...item, x, y };
  });
  const line = points.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `20,${height - 25} ${line} ${width - 20},${height - 25}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" role="img" aria-label="KNTech analytics chart">
      <defs>
        <linearGradient id="kntechArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgba(37,99,235,0.42)" />
          <stop offset="100%" stopColor="rgba(37,99,235,0.02)" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#kntechArea)" />
      <polyline points={line} fill="none" stroke="#2563eb" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} r="5" fill="#0f172a" />
          <text x={p.x} y={height - 4} textAnchor="middle" fontSize="12" fill="#64748b">{p.label}</text>
          <text x={p.x} y={p.y - 12} textAnchor="middle" fontSize="12" fill="#0f172a">{p.value}</text>
        </g>
      ))}
    </svg>
  );
}
