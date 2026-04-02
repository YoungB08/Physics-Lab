export function Avatar({ name, size = 48, variant }: { name?: string; size?: number; variant?: string }) {
  const label = (name || 'KNTech').trim();
  const initials = label
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'K';

  return (
    <div
      className={`avatar ${variant ? `avatar-${variant}` : ''}`.trim()}
      style={{ width: size, height: size, minWidth: size }}
      aria-label={label}
      title={label}
    >
      {initials}
    </div>
  );
}
