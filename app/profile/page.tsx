"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "@/lib/components/action";
import { useCurrentUser } from "@/components/UserProvider";
import { useToast } from "@/components/ToastProvider";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import {
  AdminIcon,
  BellIcon,
  BellOffIcon,
  SignOutIcon,
} from "@/components/Icon";
import { apiPost } from "@/lib/api/client";

type PushStatus = "idle" | "loading" | "granted" | "denied";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function subscribeToPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error("Push notifications are not configured for this deployment.");

  const reg = await navigator.serviceWorker.ready;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  await apiPost("/api/push/subscribe", { subscription: sub });
  return true;
}

async function unsubscribeFromPush(): Promise<boolean> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  const endpoint = sub?.endpoint;
  if (sub) await sub.unsubscribe();
  await apiPost("/api/push/unsubscribe", { endpoint });
  return true;
}

export default function ProfilePage() {
  const user = useCurrentUser();
  const toast = useToast();
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) setPushStatus("granted");
      })
      .catch(console.error);

    if ("Notification" in window && Notification.permission === "denied") {
      // External browser API sync; not derivable from React state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPushStatus("denied");
    }
  }, []);

  const handleEnablePush = async () => {
    try {
      setPushStatus("loading");
      const ok = await subscribeToPush();
      setPushStatus(ok ? "granted" : "idle");
      if (ok) toast.success("Push notifications enabled");
      else toast.error("Push permission denied");
    } catch (err) {
      setPushStatus("idle");
      toast.error((err as Error).message);
    }
  };

  const handleDisablePush = async () => {
    try {
      setPushStatus("loading");
      await unsubscribeFromPush();
      setPushStatus("idle");
      toast.success("Push notifications disabled");
    } catch (err) {
      setPushStatus("granted");
      toast.error((err as Error).message);
    }
  };

  if (!user) {
    return (
      <main className="page">
        <PageHeader title="Account" />
        <Card>
          <div style={{ textAlign: "center" }}>
            <h3>You are not signed in</h3>
            <Link href="/auth/sign-in" className="btn btn-primary" style={{ marginTop: "1rem" }}>
              Sign in
            </Link>
          </div>
        </Card>
      </main>
    );
  }

  return (
    <main className="page">
      <PageHeader title="Account" />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <Card style={{ display: "flex", alignItems: "center", gap: "1.5rem", background: "var(--primary)", color: "white" }}>
          <Avatar name={user.name} email={user.email} src={user.image} size={80} />
          <div style={{ minWidth: 0 }}>
            <h2 style={{ color: "white", marginBottom: "0.25rem" }}>{user.name ?? "Shop Staff"}</h2>
            <p style={{ opacity: 0.85, marginBottom: "0.75rem", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</p>
            <span
              className="badge"
              style={{ background: "rgba(255,255,255,0.18)", color: "white", display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              {user.role === "admin" ? <AdminIcon size={12} aria-hidden /> : null}
              {user.role === "admin" ? "Admin" : user.role === "price_manager" ? "Price Manager" : "Staff"}
            </span>
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: "1.25rem" }}>Notifications</h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Push alerts</div>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Get real-time alerts for new debts and stock issues.
              </p>
            </div>
            {pushStatus === "loading" ? (
              <Button variant="ghost" size="sm" loading>
                Updating
              </Button>
            ) : pushStatus === "granted" ? (
              <Button variant="danger" size="sm" leadingIcon={<BellOffIcon size={16} aria-hidden />} onClick={handleDisablePush}>
                Disable alerts
              </Button>
            ) : pushStatus === "denied" ? (
              <Badge variant="danger">Blocked (reset in browser)</Badge>
            ) : (
              <Button variant="primary" size="sm" leadingIcon={<BellIcon size={16} aria-hidden />} onClick={handleEnablePush}>
                Enable alerts
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <h3 style={{ marginBottom: "1.25rem" }}>Account</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "0 0.25rem" }}>
              Signed in as <strong style={{ color: "var(--text-primary)" }}>{user.email}</strong>
            </div>
            <div style={{ height: 1, background: "var(--border)", margin: "0.25rem 0" }} />
            <Button
              variant="danger"
              onClick={() => signOut()}
              leadingIcon={<SignOutIcon size={20} aria-hidden />}
              loadingText="Signing out…"
              style={{ justifyContent: "flex-start" }}
            >
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </main>
  );
}
