"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="empty-state">
      <h1>
        Түр <em>саатал гарлаа.</em>
      </h1>
      <p>Хуудсыг дахин ачаалж үзээрэй.</p>
      <button className="button dark" onClick={reset}>
        Дахин оролдох
      </button>
    </main>
  );
}
