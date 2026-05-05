export function NotificationsPage() {
  const rows = [
    "Request MUY-2605-001 is waiting for producer review.",
    "Draft item will expire in 7 days.",
    "Request MUY-2605-002 moved to waiting payment."
  ];

  return (
    <section>
      <h2>Notifications</h2>
      <div className="card">
        {rows.map((x) => (
          <p key={x}>{x}</p>
        ))}
      </div>
    </section>
  );
}
