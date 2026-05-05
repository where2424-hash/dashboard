import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listRequests, updateStatus } from "../mockApi";
import type { ExpenseRequest, Role, RequestStatus } from "../types";

const statusText: Record<RequestStatus, string> = {
  draft: "Draft",
  producer_review: "Producer Review",
  treasury_review: "Treasury Review",
  waiting_receipt: "Waiting Receipt",
  waiting_payment: "Waiting Payment",
  rejected: "Rejected",
  done: "Done"
};

export function ExpensesPage({ role }: { role: Role }) {
  const [rows, setRows] = useState<ExpenseRequest[]>([]);
  const [keyword, setKeyword] = useState("");

  async function reload() {
    setRows(await listRequests());
  }

  useEffect(() => {
    void reload();
  }, []);

  const canApprove = role === "producer" || role === "treasury" || role === "admin";
  const filtered = rows.filter(
    (r) =>
      r.requestNo.toLowerCase().includes(keyword.toLowerCase()) ||
      r.applicant.toLowerCase().includes(keyword.toLowerCase()) ||
      r.project.toLowerCase().includes(keyword.toLowerCase())
  );

  return (
    <section>
      <h2>Expense Requests</h2>
      <div className="toolbar">
        <input
          placeholder="Search request / project / applicant"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Request No</th>
            <th>Project</th>
            <th>Applicant</th>
            <th>Category</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td>
                <Link to={`/expenses/${r.id}`}>{r.requestNo}</Link>
              </td>
              <td>{r.project}</td>
              <td>{r.applicant}</td>
              <td>{r.category}</td>
              <td>${r.amount.toLocaleString()}</td>
              <td>{statusText[r.status]}</td>
              <td>{r.updatedAt}</td>
              <td>
                {canApprove ? (
                  <button
                    onClick={async () => {
                      await updateStatus(r.id, r.status === "done" ? "producer_review" : "done");
                      await reload();
                    }}
                  >
                    Toggle Done
                  </button>
                ) : (
                  <span>-</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
