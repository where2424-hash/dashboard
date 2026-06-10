import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listRequests, updateStatus } from "../mockApi";
import type { ExpenseRequest, Role } from "../types";

export function RequestDetailPage({ role }: { role: Role }) {
  const { id } = useParams();
  const [row, setRow] = useState<ExpenseRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isCurrent = true;

    setRow(null);
    setIsLoading(true);

    (async () => {
      const data = await listRequests();
      if (!isCurrent) return;

      setRow(data.find((r) => r.id === id) ?? null);
      setIsLoading(false);
    })();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  if (isLoading || (row && row.id !== id)) return <p>Loading request...</p>;
  if (!row) return <p>Request not found.</p>;

  const canReject = role === "producer" || role === "treasury" || role === "admin";

  return (
    <section>
      <h2>Request Detail</h2>
      <div className="card">
        <p>
          <strong>{row.requestNo}</strong>
        </p>
        <p>Project: {row.project}</p>
        <p>Applicant: {row.applicant}</p>
        <p>Category: {row.category}</p>
        <p>Amount: ${row.amount.toLocaleString()}</p>
        <p>Summary: {row.summary}</p>
        <p>Status: {row.status}</p>
        {canReject && (
          <button
            onClick={async () => {
              const requestId = row.id;
              await updateStatus(requestId, "rejected");
              setRow((current) => (current?.id === requestId ? { ...current, status: "rejected" } : current));
            }}
          >
            Reject
          </button>
        )}
      </div>
    </section>
  );
}
