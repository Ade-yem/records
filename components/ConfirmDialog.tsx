"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false);

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm();
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal open={open} onClose={onCancel} title={title} size="sm">
      {description ? (
        <div style={{ color: "var(--text-secondary)", marginBottom: "1.25rem", fontSize: "0.95rem" }}>
          {description}
        </div>
      ) : null}
      <div style={{ display: "flex", gap: "1rem" }}>
        <Button variant="ghost" fullWidth onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </Button>
        <Button
          variant={destructive ? "danger" : "primary"}
          fullWidth
          onClick={handleConfirm}
          loading={pending}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
