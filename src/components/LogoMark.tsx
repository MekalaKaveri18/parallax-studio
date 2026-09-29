/**
 * Parallax mark: three slanted frames stepping forward in depth — the same
 * scene seen from a moving camera. Solid, separated bars stay legible at 16px.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#14141c" />
      <path d="M8.2 8h4.6l-3.4 16H4.8z" fill="#ffb38a" />
      <path d="M14.6 8h4.6l-3.4 16h-4.6z" fill="#ff7eb6" />
      <path d="M21 8h6.6l-3.4 16h-6.6z" fill="#a594ff" />
    </svg>
  );
}
