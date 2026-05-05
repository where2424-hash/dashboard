export function DashboardPage() {
  return (
    <section>
      <h2>Dashboard</h2>
      <div className="grid">
        <article className="card">
          <h3>Pending Reviews</h3>
          <p>3 requests need action.</p>
        </article>
        <article className="card">
          <h3>Upcoming Schedule</h3>
          <p>Shooting Day 1 - 2026/05/07</p>
        </article>
        <article className="card">
          <h3>Alerts</h3>
          <p>1 duplicate receipt warning.</p>
        </article>
      </div>
    </section>
  );
}
