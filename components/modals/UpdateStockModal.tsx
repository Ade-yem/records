"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { InputField } from "@/components/FormField";
import { LowStockIcon, OutOfStockIcon, RestockedIcon, type IconComponent } from "@/components/Icon";
import { apiPatch, ApiError } from "@/lib/api/client";
import type { InventoryItem, StockStatus } from "@/lib/types";

const STATUS_META: Record<StockStatus, { label: string; icon: IconComponent }> = {
  LOW_STOCK: { label: "Low stock", icon: LowStockIcon },
  OUT_OF_STOCK: { label: "Out of stock", icon: OutOfStockIcon },
  RESTOCKED: { label: "Restocked", icon: RestockedIcon },
};

const STATUSES: StockStatus[] = ["LOW_STOCK", "OUT_OF_STOCK", "RESTOCKED"];

interface UpdateStockModalProps {
  open: boolean;
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: () => void;
}

export function UpdateStockModal({ open, item, onClose, onSaved }: UpdateStockModalProps) {
  // Parent should pass key={item?.id ?? "none"} to remount per target.
  const [status, setStatus] = useState<StockStatus>(item?.status ?? "LOW_STOCK");
  const [quantity, setQuantity] = useState(item?.quantity?.toString() ?? "0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!item) return;
    setLoading(true);
    setError(null);
    try {
      await apiPatch(`/api/inventory/${item.id}`, {
        status,
        quantity: status !== "RESTOCKED" ? parseInt(quantity, 10) || 0 : 0,
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  return (
    <Modal open={open} onClose={onClose} closeDisabled={loading} title="Update stock" description={item.itemName}>
      {error ? <div style={{ marginBottom: "1rem" }}><Alert variant="danger">{error}</Alert></div> : null}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {STATUSES.map((s) => {
          const meta = STATUS_META[s];
          const Icon = meta.icon;
          const active = status === s;
          return (
            <Button
              key={s}
              variant={active ? "primary" : "ghost"}
              onClick={() => setStatus(s)}
              leadingIcon={<Icon size={18} aria-hidden />}
              style={{ justifyContent: "flex-start", padding: "0.85rem" }}
            >
              {meta.label}
            </Button>
          );
        })}
      </div>

      {status !== "RESTOCKED" ? (
        <div style={{ marginBottom: "1.25rem" }}>
          <InputField
            label="Remaining quantity"
            type="number"
            min={0}
            placeholder="e.g. 5"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      ) : null}

      <div style={{ display: "flex", gap: "1rem" }}>
        <Button variant="ghost" fullWidth onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="primary" onClick={submit} loading={loading} style={{ flex: 2 }}>
          Save changes
        </Button>
      </div>
    </Modal>
  );
}
