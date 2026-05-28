"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/Skeleton";
import { AddInventoryModal } from "@/components/modals/AddInventoryModal";
import { UpdateStockModal } from "@/components/modals/UpdateStockModal";
import { PlusIcon, RestockedIcon } from "@/components/Icon";
import { apiGet, ApiError, type ListResponse } from "@/lib/api/client";
import { timeAgo } from "@/lib/utils";
import type { InventoryItem, StockStatus } from "@/lib/types";

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "LOW_STOCK") return <Badge variant="warning">Low stock</Badge>;
  if (status === "OUT_OF_STOCK") return <Badge variant="danger">Out of stock</Badge>;
  return <Badge variant="success">Restocked</Badge>;
}

export default function InventoryPage() {
  const toast = useToast();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<InventoryItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<ListResponse<InventoryItem>>("/api/inventory", {
        query: { all: showAll ? "true" : undefined },
      });
      setItems(data.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  }, [showAll, toast]);

  useEffect(() => {
    // Replaced by TanStack Query in Phase 5; until then, fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const counts = useMemo(
    () => ({
      out: items.filter((i) => i.status === "OUT_OF_STOCK").length,
      low: items.filter((i) => i.status === "LOW_STOCK").length,
      restocked: items.filter((i) => i.status === "RESTOCKED").length,
    }),
    [items],
  );

  return (
    <>
      <main className="page">
        <PageHeader
          title="Inventory"
          description="Monitor stock shortages and replenishment."
          actions={
            <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Active shortages" : "View all items"}
            </Button>
          }
        />

        <section className="stat-grid">
          <StatCard label="Out of stock" value={counts.out} tone="danger" />
          <StatCard label="Low stock" value={counts.low} tone="warning" />
          <StatCard label="Restocked" value={counts.restocked} tone="success" />
        </section>

        {loading ? (
          <SkeletonList rows={4} rowHeight={88} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={RestockedIcon}
            title="Inventory looks good"
            description="No stock shortages reported at the moment."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {items.map((item) => {
              const restocked = item.status === "RESTOCKED";
              return (
                <Card
                  key={item.id}
                  onClick={() => setSelected(item)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    padding: "1.25rem",
                    cursor: "pointer",
                    // Resolved items get a green left accent instead of blanket opacity
                    // so they don't look disabled/unclickable
                    borderLeft: restocked ? "3px solid var(--success)" : undefined,
                    background: restocked ? "#F0FFF4" : undefined,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "0.5rem" }}>
                    <h3
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: restocked ? 500 : 700,
                        color: restocked ? "var(--text-secondary)" : undefined,
                      }}
                    >
                      {item.itemName}
                    </h3>
                    <StatusBadge status={item.status} />
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", color: "var(--text-muted)", gap: "0.5rem", flexWrap: "wrap" }}>
                    <div>
                      {timeAgo(item.createdAt)}
                      {!restocked ? (
                        <span style={{ fontWeight: 700, color: "var(--danger)" }}>
                          {" "}• {item.quantity} remaining
                        </span>
                      ) : null}
                    </div>
                    <div>Reported by {item.reporterName}</div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <button
        className="fab"
        onClick={() => setShowAdd(true)}
        aria-label="Report shortage"
      >
        <PlusIcon size={28} aria-hidden />
      </button>

      <AddInventoryModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => {
          load();
          toast.success("Shortage reported");
        }}
      />

      <UpdateStockModal
        key={selected?.id ?? "none"}
        open={selected !== null}
        item={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          load();
          toast.success("Stock updated");
        }}
      />
    </>
  );
}

