"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { InputField } from "@/components/FormField";
import { apiPatch, ApiError } from "@/lib/api/client";
import { fmt, timeAgo } from "@/lib/utils";
import { CURRENCY } from "@/lib/i18n";
import type { DebtEntry } from "@/lib/types";

interface RecordPaymentModalProps {
  open: boolean;
  entry: DebtEntry | null;
  onClose: () => void;
  onSaved: () => void;
}

export function RecordPaymentModal({ open, entry, onClose, onSaved }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry || !amount) return;
    setLoading(true);
    setError(null);
    try {
      await apiPatch(`/api/debt/${entry.id}`, {
        amount: parseFloat(amount),
        note,
      });
      onSaved();
      setAmount("");
      setNote("");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  if (!entry) return null;

  return (
    <Modal open={open} onClose={onClose} closeDisabled={loading} title="Record payment" description={entry.customerName}>
      {error ? <div style={{ marginBottom: "1rem" }}><Alert variant="danger">{error}</Alert></div> : null}

      <div
        style={{
          background: "var(--primary-soft)",
          borderRadius: 12,
          padding: "1rem 1.25rem",
          marginBottom: "1.25rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1rem",
        }}
      >
        <div>
          <div className="ledger-amount-label">Balance due</div>
          <div className="ledger-amount-value" style={{ color: "var(--danger)", fontSize: "1.25rem" }}>{fmt(entry.balance)}</div>
        </div>
        <div>
          <div className="ledger-amount-label">Paid</div>
          <div className="ledger-amount-value" style={{ color: "var(--success)" }}>{fmt(entry.amountPaid)}</div>
        </div>
      </div>

      {entry.payments.length > 0 ? (
        <div style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "0.9rem", marginBottom: "0.75rem", color: "var(--text-secondary)" }}>Payment history</h3>
          <div style={{ maxHeight: 120, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
            {entry.payments.map((p) => (
              <div
                key={p.id}
                style={{
                  padding: "0.75rem",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.85rem",
                }}
              >
                <span className="text-success" style={{ fontWeight: 700 }}>+{fmt(p.amount)}</span>
                <span style={{ color: "var(--text-muted)" }}>{timeAgo(p.paidAt)}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
        <InputField
          label={`Amount paid (${CURRENCY.symbol})`}
          type="number"
          min={0.01}
          step="0.01"
          max={Number(entry.balance)}
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <InputField
          label="Note (optional)"
          placeholder="e.g. part payment"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <Button variant="ghost" fullWidth type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} style={{ flex: 2 }}>
            Record payment
          </Button>
        </div>
      </form>
    </Modal>
  );
}
