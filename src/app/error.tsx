'use client';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-state" style={{ minHeight: '70vh', justifyContent: 'center' }}>
      <p className="eyebrow">JUST A MOMENT</p>
      <h1 style={{ fontSize: 'calc(36px * var(--font-scale))', fontWeight: 400 }}>
        We couldn’t load this view.
      </h1>
      <p>Please try again in a moment.</p>
      <button className="btn btn-primary" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
