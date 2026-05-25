"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { InputField, SelectField } from "@/components/FormField";
import { Autocomplete, makeProductSuggestionFetcher } from "@/components/Autocomplete";
import { PackageIcon } from "@/components/Icon";
import { apiPost, ApiError } from "@/lib/api/client";
import type { ProductSuggestion } from "@/lib/types";

const fetchProducts = makeProductSuggestionFetcher<ProductSuggestion>();

interface AddInventoryModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function AddInventoryModal({ open, onClose, onSaved }: AddInventoryModalProps) {
  const [itemName, setItemName] = useState("");
  const [status, setStatus] = useState<"LOW_STOCK" | "OUT_OF_STOCK">("LOW_STOCK");
  const [quantity, setQuantity] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setItemName("");
    setStatus("LOW_STOCK");
    setQuantity("0");
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
    if (!itemName.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost("/api/inventory", {
        itemName: itemName.trim(),
        status,
        quantity: parseInt(quantity, 10) || 0,
      });
      onSaved();
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to report shortage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Report shortage"
      description="Suggestions come from your product catalog."
    >
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <Autocomplete<ProductSuggestion>
          label="Item name"
          placeholder="e.g. Indomie Noodles"
          value={itemName}
          onChange={setItemName}
          fetchSuggestions={fetchProducts}
          getOptionLabel={(p) => p.name}
          renderOption={(p) => (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <PackageIcon size={14} aria-hidden /> {p.name}
            </span>
          )}
          required
        />

        <SelectField
          label="Shortage status"
          value={status}
          onChange={(e) => setStatus(e.target.value as "LOW_STOCK" | "OUT_OF_STOCK")}
          disabled={loading}
        >
          <option value="LOW_STOCK">Low stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </SelectField>

        <InputField
          label="Remaining quantity"
          type="number"
          min={0}
          placeholder="e.g. 2"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          disabled={loading}
        />

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <Button variant="ghost" fullWidth type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} style={{ flex: 2 }}>
            Save report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
