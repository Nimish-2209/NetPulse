export default function RoutePlaceholder({ title }) {
  return (
    <main className="route-placeholder">
      <section className="panel">
        <p className="eyebrow">NetPulse</p>
        <h1>{title}</h1>
        <p className="subtle">This view is part of the main dashboard experience.</p>
        <a className="secondary-button route-link" href="/app">
          Open dashboard
        </a>
      </section>
    </main>
  );
}
