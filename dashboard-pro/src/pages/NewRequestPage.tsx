import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../mockApi";

export function NewRequestPage() {
  const nav = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    requestNo: `MUY-2605-${String(Math.floor(Math.random() * 900) + 100)}`,
    project: "Project A",
    applicant: "Demo User",
    category: "Travel",
    amount: "",
    summary: "",
    status: "producer_review" as const
  });
  const parsedAmount = Number(form.amount);
  const canSubmit =
    Boolean(form.summary.trim()) &&
    form.amount.trim() !== "" &&
    Number.isFinite(parsedAmount) &&
    parsedAmount > 0 &&
    !isSubmitting;

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
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
          disabled={!canSubmit}
          onClick={async () => {
            const payload = {
              ...form,
              amount: Number(form.amount),
              project: form.project.trim(),
              applicant: form.applicant.trim(),
              category: form.category.trim(),
              summary: form.summary.trim()
            };

            if (!Number.isFinite(payload.amount) || payload.amount <= 0 || !payload.summary || isSubmitting) {
              return;
            }

            setIsSubmitting(true);
            try {
              await createRequest(payload);
              nav("/expenses");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          {isSubmitting ? "Submitting..." : "Submit Request"}
        </button>
      </div>
    </section>
  );
}
