import Link from 'next/link';
export function PlazaMark({ size = 42 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path
        d="M4 41h40M10 40V22l10-5v23M20 40V7l4-3 9 6v30M33 40V23l7 4v13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M24 8v29" stroke="currentColor" strokeOpacity=".2" />
    </svg>
  );
}
export function Logo({ name = 'The Plaza' }: { name?: string }) {
  return (
    <Link className="logo" href="/" aria-label={`${name} home`}>
      <PlazaMark />
      <span>
        <strong>{name}</strong>
        <small>COMMERCIAL SPACES</small>
      </span>
    </Link>
  );
}
