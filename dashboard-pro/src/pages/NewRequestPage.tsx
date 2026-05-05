import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../mockApi";

export function NewRequestPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    requestNo: `MUY-2605-${String(Math.floor(Math.random() * 900) + 100)}`,
    project: "Project A",
    applicant: "Demo User",
    category: "Travel",
    amount: 0,
    summary: "",
    status: "producer_review" as const
  });

  return (
    <section>
      <h2>New Request</h2>
      <div className="form">
        <label>
          Project
          <input value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })} />
        </label>
        <label>
          Applicant
          <input
            value={form.applicant}
            onChange={(e) => setForm({ ...form, applicant: e.target.value })}
          />
        </label>
        <label>
          Category
          <input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </label>
        <label>
          Amount
          <input
            type="number"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
          />
        </label>
        <label>
          Summary
          <textarea
            value={form.summary}
            onChange={(e) => setForm({ ...form, summary: e.target.value })}
          />
        </label>
        <button
          onClick={async () => {
            if (!form.summary || form.amount <= 0) return;
            await createRequest(form);
            nav("/expenses");
          }}
        >
          Submit Request
        </button>
      </div>
    </section>
  );
}
