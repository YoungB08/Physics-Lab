export function PageLoader({ visible, label = 'KNTech đang tải dữ liệu...' }: { visible: boolean; label?: string }) {
  if (!visible) return null;
  return (
    <div className="page-loader-overlay" role="status" aria-live="polite">
      <div className="page-loader-card">
        <div className="loader-spinner" />
        <div className="loader-brand">KNTech</div>
        <div className="muted">{label}</div>
      </div>
    </div>
  );
}
