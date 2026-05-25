"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { InputField } from "@/components/FormField";
import { apiPost, apiPatch, ApiError } from "@/lib/api/client";
import { CURRENCY } from "@/lib/i18n";
import type { Product } from "@/lib/types";

interface ProductModalProps {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  onSaved: (mode: "create" | "update") => void;
}

export function ProductModal({ open, product, onClose, onSaved }: ProductModalProps) {
  // Parent should pass key={product?.id ?? "new"} to remount on target change.
  const [name, setName] = useState(product?.name ?? "");
  const [priceUnit, setPriceUnit] = useState(product?.priceUnit ?? "");
  const [unitName, setUnitName] = useState(product?.unitName ?? "pcs");
  const [priceBulk, setPriceBulk] = useState(product?.priceBulk ?? "");
  const [bulkName, setBulkName] = useState(product?.bulkName ?? "carton");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !priceUnit || !priceBulk) return;
    setLoading(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        priceUnit: parseFloat(priceUnit),
        unitName: unitName.trim(),
        priceBulk: parseFloat(priceBulk),
        bulkName: bulkName.trim(),
      };
      if (product) {
        await apiPatch(`/api/products/${product.id}`, body);
        onSaved("update");
      } else {
        await apiPost("/api/products", body);
        onSaved("create");
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => {} : onClose}
      title={product ? "Edit product" : "Add product"}
      description="Set name, unit price, and bulk price."
    >
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <InputField
          label="Product name"
          placeholder="e.g. Indomie Onion Chicken"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 2 }}>
            <InputField
              label={`Unit price (${CURRENCY.symbol})`}
              type="number"
              min={0}
              step="0.01"
              placeholder="100.00"
              value={priceUnit}
              onChange={(e) => setPriceUnit(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div style={{ flex: 1 }}>
            <InputField
              label="Unit label"
              placeholder="pcs"
              value={unitName}
              onChange={(e) => setUnitName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem" }}>
          <div style={{ flex: 2 }}>
            <InputField
              label={`Bulk price (${CURRENCY.symbol})`}
              type="number"
              min={0}
              step="0.01"
              placeholder="2400.00"
              value={priceBulk}
              onChange={(e) => setPriceBulk(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div style={{ flex: 1 }}>
            <InputField
              label="Bulk label"
              placeholder="carton"
              value={bulkName}
              onChange={(e) => setBulkName(e.target.value)}
              required
              disabled={loading}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <Button variant="ghost" fullWidth type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} style={{ flex: 2 }}>
            {product ? "Save changes" : "Add product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
