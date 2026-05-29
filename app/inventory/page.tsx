"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { useIsAdmin } from "@/components/UserProvider";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/Skeleton";
import { Autocomplete } from "@/components/Autocomplete";
import { AddInventoryModal } from "@/components/modals/AddInventoryModal";
import { UpdateStockModal } from "@/components/modals/UpdateStockModal";
import { PlusIcon, RestockedIcon } from "@/components/Icon";
import { TimeAgo } from "@/components/TimeAgo";
import { apiGet, ApiError, type ListResponse } from "@/lib/api/client";
import { useSearchShortcut } from "@/lib/hooks/useSearchShortcut";
import type { InventoryItem, StockStatus } from "@/lib/types";

type SortKey = "newest" | "oldest" | "name-asc" | "name-desc";

function StatusBadge({ status }: { status: StockStatus }) {
  if (status === "LOW_STOCK") return <Badge variant="warning">Low stock</Badge>;
  if (status === "OUT_OF_STOCK") return <Badge variant="danger">Out of stock</Badge>;
  return <Badge variant="success">Restocked</Badge>;
}

type StatusFilter = "all" | "OUT_OF_STOCK" | "LOW_STOCK" | "RESTOCKED";

export default function InventoryPage() {
  const toast = useToast();
  const isAdmin = useIsAdmin();
  const searchRef = useSearchShortcut();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
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

  const localFetch = useCallback(
    async (q: string) => {
      const qq = q.toLowerCase();
      return items
        .filter((i) => i.itemName.toLowerCase().includes(qq))
        .map((i) => i.itemName)
        .slice(0, 6);
    },
    [items],
  );

  const filtered = useMemo(() => {
    let result = items;
    if (statusFilter !== "all") {
      result = result.filter((i) => i.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((i) => i.itemName.toLowerCase().includes(q));
    }
    return [...result].sort((a, b) => {
      if (sort === "name-asc") return a.itemName.localeCompare(b.itemName);
      if (sort === "name-desc") return b.itemName.localeCompare(a.itemName);
      if (sort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // newest
    });
  }, [items, statusFilter, search, sort]);

  const toggleStatus = (s: Exclude<StatusFilter, "all">) => {
    if (s === "RESTOCKED" && !showAll) {
      setShowAll(true);
      setStatusFilter("RESTOCKED");
      return;
    }
    setStatusFilter((prev) => (prev === s ? "all" : s));
  };

  return (
    <>
      <main className="page">
        <PageHeader
          title="Inventory"
          description="Monitor stock shortages and replenishment."
          actions={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAll((v) => !v);
                setStatusFilter("all");
              }}
            >
              {showAll ? "Hide resolved" : "Show resolved"}
            </Button>
          }
        />

        <section className="stat-grid">
          <StatCard
            label="Out of stock"
            value={counts.out}
            tone="danger"
            onClick={() => toggleStatus("OUT_OF_STOCK")}
            active={statusFilter === "OUT_OF_STOCK"}
          />
          <StatCard
            label="Low stock"
            value={counts.low}
            tone="warning"
            onClick={() => toggleStatus("LOW_STOCK")}
            active={statusFilter === "LOW_STOCK"}
          />
          <StatCard
            label="Restocked"
            value={showAll ? counts.restocked : 0}
            tone="success"
            onClick={() => toggleStatus("RESTOCKED")}
            active={statusFilter === "RESTOCKED"}
          />
        </section>

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "center" }}>
          <div ref={searchRef} style={{ flex: 1 }}>
            <Autocomplete<string>
              label="Search inventory"
              hideLabel
              inputType="search"
              placeholder="Search by item name…  ( / )"
              showSearchIcon
              value={search}
              onChange={setSearch}
              fetchSuggestions={localFetch}
              renderOption={(s) => s}
              getOptionLabel={(s) => s}
            />
          </div>
          <select
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            aria-label="Sort inventory"
            style={{ width: "auto", flexShrink: 0 }}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
          </select>
        </div>

        {loading ? (
          <SkeletonList rows={4} rowHeight={88} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={RestockedIcon}
            title={
              search
                ? "No items match your search"
                : statusFilter !== "all"
                ? `No ${statusFilter === "OUT_OF_STOCK" ? "out-of-stock" : statusFilter === "LOW_STOCK" ? "low-stock" : "restocked"} items`
                : "Inventory looks good"
            }
            description={
              search
                ? `No items found for "${search}".`
                : statusFilter !== "all"
                ? "No items with this status at the moment."
                : "No stock shortages reported at the moment."
            }
            action={
              statusFilter !== "all" || search ? (
                <Button variant="ghost" onClick={() => { setStatusFilter("all"); setSearch(""); }}>
                  Show all items
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filtered.map((item) => {
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
                      <TimeAgo iso={item.createdAt} />
                      {!restocked && item.quantity > 0 ? (
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
        isAdmin={isAdmin}
        onClose={() => setSelected(null)}
        onSaved={() => {
          load();
          toast.success("Stock updated");
        }}
        onDeleted={() => {
          load();
          setSelected(null);
          toast.success("Item removed");
        }}
      />
    </>
  );
}
