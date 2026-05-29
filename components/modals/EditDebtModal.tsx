"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { InputField, TextareaField } from "@/components/FormField";
import { apiPatch, ApiError } from "@/lib/api/client";
import { CURRENCY } from "@/lib/i18n";
import type { DebtEntry } from "@/lib/types";

interface EditDebtModalProps {
  open: boolean;
  entry: DebtEntry | null;
  onClose: () => void;
  onSaved: (updated: DebtEntry) => void;
}

export function EditDebtModal({ open, entry, onClose, onSaved }: EditDebtModalProps) {
  const [customerName, setCustomerName] = useState(entry?.customerName ?? "");
  const [totalDebt, setTotalDebt] = useState(entry ? String(Number(entry.totalDebt)) : "");
  const [notes, setNotes] = useState(entry?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!entry) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updated = await apiPatch<DebtEntry>(`/api/debt/${entry.id}`, {
        action: "edit",
        customerName: customerName.trim() || undefined,
        totalDebt: totalDebt ? parseFloat(totalDebt) : undefined,
        notes: notes.trim() || null,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} closeDisabled={loading} title="Edit debt entry" description={entry.customerName}>
      {error ? <div style={{ marginBottom: "1rem" }}><Alert variant="danger">{error}</Alert></div> : null}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
        <InputField
          label="Customer name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          required
        />
        <InputField
          label={`Total debt (${CURRENCY.symbol})`}
          type="number"
          min={0.01}
          step="0.01"
          value={totalDebt}
          onChange={(e) => setTotalDebt(e.target.value)}
          required
        />
        <TextareaField
          label="Notes (optional)"
          placeholder="e.g. goods collected on credit"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <Button variant="ghost" fullWidth type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} loadingText="Saving…" style={{ flex: 2 }}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
