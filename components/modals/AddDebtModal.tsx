"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { InputField, TextareaField } from "@/components/FormField";
import { Autocomplete, makeCustomerSuggestionFetcher } from "@/components/Autocomplete";
import { ProfileIcon } from "@/components/Icon";
import { apiPost, ApiError } from "@/lib/api/client";
import { CURRENCY } from "@/lib/i18n";

const fetchCustomers = makeCustomerSuggestionFetcher();

interface AddDebtModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialName?: string;
}

export function AddDebtModal({ open, onClose, onSaved, initialName }: AddDebtModalProps) {
  const [name, setName] = useState("");
  const initialNameRef = useRef(initialName);
  initialNameRef.current = initialName;

  useEffect(() => {
    if (open && initialNameRef.current) setName(initialNameRef.current);
  }, [open]);
  const [total, setTotal] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setTotal("");
    setNotes("");
    setError(null);
    setLoading(false);
  };

  const handleClose = () => {
    if (loading) return;
    reset();
    onClose();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !total) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost("/api/debt", {
        customerName: name.trim(),
        totalDebt: parseFloat(total),
        notes,
      });
      onSaved();
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save entry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="New debt entry">
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Autocomplete<string>
          label="Customer name"
          placeholder="e.g. Iya Shola"
          value={name}
          onChange={setName}
          fetchSuggestions={fetchCustomers}
          getOptionLabel={(s) => s}
          renderOption={(s) => (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <ProfileIcon size={14} aria-hidden /> {s}
            </span>
          )}
          required
        />

        <InputField
          label={`Total debt (${CURRENCY.symbol})`}
          type="number"
          min={0}
          step="0.01"
          placeholder="5000.00"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          required
        />

        <TextareaField
          label="Notes (optional)"
          placeholder="Item purchased, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <Button variant="ghost" fullWidth type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} style={{ flex: 2 }}>
            Save entry
          </Button>
        </div>
      </form>
    </Modal>
  );
}
