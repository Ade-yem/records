"use client";

import { useState } from "react";
import { Modal } from "@/components/Modal";
import { Button } from "@/components/Button";
import { Alert } from "@/components/Alert";
import { InputField, SelectField } from "@/components/FormField";
import { apiPost, ApiError } from "@/lib/api/client";
import type { UserRole } from "@/lib/types";

interface AddUserModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AddUserModal({ open, onClose, onCreated }: AddUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("staff");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("staff");
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
    if (!name.trim() || !email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      await apiPost("/api/admin/users", {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      onCreated();
      reset();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add staff account"
      description="Create credentials for a new team member."
    >
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
        {error ? <Alert variant="danger">{error}</Alert> : null}

        <InputField
          label="Name"
          placeholder="e.g. Iya Lola"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
          autoComplete="name"
        />
        <InputField
          label="Email address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          autoComplete="email"
        />
        <InputField
          label="Password"
          type="password"
          placeholder="Minimum 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          disabled={loading}
          autoComplete="new-password"
        />
        <SelectField
          label="Access level"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          disabled={loading}
        >
          <option value="staff">Staff — add debts, report inventory (read-only on prices)</option>
          <option value="price_manager">Price Manager — staff access + add/edit prices</option>
          <option value="admin">Administrator — full access, delete data, manage users</option>
        </SelectField>

        <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
          <Button variant="ghost" fullWidth type="button" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={loading} style={{ flex: 2 }}>
            Create account
          </Button>
        </div>
      </form>
    </Modal>
  );
}
