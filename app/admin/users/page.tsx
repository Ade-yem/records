"use client";

import { useCallback, useEffect, useState } from "react";
import { useCurrentUser } from "@/components/UserProvider";
import { useToast } from "@/components/ToastProvider";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/Skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AddUserModal } from "@/components/modals/AddUserModal";
import { AdminIcon, BanIcon, LockIcon, ShieldIcon, UnlockIcon, UserPlusIcon, UsersIcon } from "@/components/Icon";
import { apiGet, apiPatch, ApiError, type ListResponse } from "@/lib/api/client";
import type { AdminUser, UserRole } from "@/lib/types";

const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  price_manager: "Price Manager",
  staff: "Staff",
};

const ROLE_BADGE: Record<UserRole, "warning" | "info" | "success"> = {
  admin: "warning",
  price_manager: "info",
  staff: "success",
};

export default function AdminUsersPage() {
  const me = useCurrentUser();
  const toast = useToast();
  const isAdmin = me?.role === "admin";

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<AdminUser | null>(null);

  const load = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const data = await apiGet<ListResponse<AdminUser>>("/api/admin/users");
      setUsers(data.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, toast]);

  useEffect(() => {
    // Replaced by TanStack Query in Phase 5; until then, fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const handleChangeRole = async (user: AdminUser, newRole: UserRole) => {
    if (newRole === user.role) return;
    try {
      await apiPatch(`/api/admin/users/${user.id}`, { action: "set_role", role: newRole });
      toast.success(`${user.name}'s role updated to ${ROLE_LABEL[newRole]}`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update role");
    }
  };

  const handleToggleAccess = async () => {
    const user = confirmTarget;
    if (!user) return;
    const action = user.banned ? "enable" : "disable";
    try {
      await apiPatch(`/api/admin/users/${user.id}`, { action });
      toast.success(user.banned ? `Access enabled for ${user.name}` : `Access disabled for ${user.name}`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update access");
    } finally {
      setConfirmTarget(null);
    }
  };

  if (!me || !isAdmin) {
    return (
      <main className="page" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <Card style={{ textAlign: "center", maxWidth: 400 }}>
          <BanIcon size={48} aria-hidden style={{ color: "var(--danger)", marginBottom: "1rem" }} />
          <h2>Access denied</h2>
          <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
            You must be signed in as an administrator to access user management.
          </p>
        </Card>
      </main>
    );
  }

  return (
    <main className="page">
      <PageHeader
        title="User management"
        description="Onboard new team members and manage access and roles."
        actions={
          <Button
            variant="primary"
            size="sm"
            leadingIcon={<UserPlusIcon size={16} aria-hidden />}
            onClick={() => setShowAdd(true)}
          >
            Add staff
          </Button>
        }
      />

      <Card style={{ marginBottom: "1.5rem", padding: "1rem", fontSize: "0.82rem", color: "var(--text-muted)", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        <span><strong style={{ color: "var(--text-primary)" }}>Staff</strong> — debt &amp; inventory</span>
        <span><strong style={{ color: "var(--text-primary)" }}>Price Manager</strong> — staff + edit prices</span>
        <span><strong style={{ color: "var(--text-primary)" }}>Admin</strong> — full access + manage users</span>
      </Card>

      {loading ? (
        <SkeletonList rows={3} rowHeight={120} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="No team members yet"
          description="Add a staff account to get started."
          action={<Button variant="primary" onClick={() => setShowAdd(true)}>Add staff</Button>}
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {users.map((u) => (
            <Card
              key={u.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
                padding: "1.25rem",
                opacity: u.banned ? 0.65 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                  {u.role === "admin" ? <AdminIcon size={16} aria-hidden style={{ color: "var(--warning)" }} /> : null}
                  {u.name}
                </h3>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <Badge variant={ROLE_BADGE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  <Badge variant={u.banned ? "danger" : "success"}>{u.banned ? "Disabled" : "Active"}</Badge>
                </div>
              </div>

              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                {u.email}
              </div>

              {u.id !== me.id ? (
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                  <div style={{ flex: 1, minWidth: 160 }}>
                    <label className="ledger-amount-label" htmlFor={`role-${u.id}`} style={{ display: "block", marginBottom: 4 }}>
                      Role
                    </label>
                    <select
                      id={`role-${u.id}`}
                      className="form-select"
                      style={{ fontSize: "0.82rem", padding: "0.4rem 0.6rem" }}
                      value={u.role}
                      onChange={(e) => handleChangeRole(u, e.target.value as UserRole)}
                    >
                      <option value="staff">Staff</option>
                      <option value="price_manager">Price Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <Button
                    variant={u.banned ? "primary" : "danger"}
                    size="sm"
                    leadingIcon={u.banned ? <UnlockIcon size={14} aria-hidden /> : <LockIcon size={14} aria-hidden />}
                    onClick={() => setConfirmTarget(u)}
                  >
                    {u.banned ? "Enable access" : "Disable access"}
                  </Button>
                </div>
              ) : (
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldIcon size={14} aria-hidden />
                  This is you
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <AddUserModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={() => {
          load();
          toast.success("Staff account created");
        }}
      />

      <ConfirmDialog
        open={confirmTarget !== null}
        title={confirmTarget?.banned ? "Restore access?" : "Disable access?"}
        description={
          confirmTarget?.banned
            ? `${confirmTarget.name} will be able to sign in again.`
            : `${confirmTarget?.name} will be signed out and unable to sign back in.`
        }
        confirmLabel={confirmTarget?.banned ? "Restore access" : "Disable access"}
        destructive={!confirmTarget?.banned}
        onConfirm={handleToggleAccess}
        onCancel={() => setConfirmTarget(null)}
      />
    </main>
  );
}
