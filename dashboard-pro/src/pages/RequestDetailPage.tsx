import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { listRequests, updateStatus } from "../mockApi";
import type { ExpenseRequest, Role } from "../types";
import { canRejectStatus } from "../workflow";

export function RequestDetailPage({ role }: { role: Role }) {
  const { id } = useParams();
  const [row, setRow] = useState<ExpenseRequest | null>(null);

  useEffect(() => {
    (async () => {
      const data = await listRequests();
      setRow(data.find((r) => r.id === id) ?? null);
    })();
  }, [id]);

  if (!row) return <p>Request not found.</p>;

  const canReject =
    (role === "producer" || role === "treasury" || role === "admin") && canRejectStatus(row.status);

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
              await updateStatus(row.id, "rejected");
              setRow({ ...row, status: "rejected" });
            }}
          >
            Reject
          </button>
        )}
      </div>
    </section>
  );
}
