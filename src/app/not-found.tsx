import Link from 'next/link';
export default function NotFound() {
  return (
    <main id="main" className="empty-state" style={{ minHeight: '70vh', justifyContent: 'center' }}>
      <p className="eyebrow">A DIFFERENT DIRECTION</p>
      <h1 style={{ fontSize: 'calc(42px * var(--font-scale))', fontWeight: 400 }}>
        Let’s find your way.
      </h1>
      <p>This space is no longer listed, or the page could not be found.</p>
      <Link href="/shops" className="btn btn-primary">
        Discover the spaces
      </Link>
    </main>
  );
}
