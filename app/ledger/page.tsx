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
import { Autocomplete, makeCustomerSuggestionFetcher } from "@/components/Autocomplete";
import { AddDebtModal } from "@/components/modals/AddDebtModal";
import { RecordPaymentModal } from "@/components/modals/RecordPaymentModal";
import { LedgerIcon, PlusIcon } from "@/components/Icon";
import { apiGet, ApiError, type ListResponse } from "@/lib/api/client";
import { fmt, timeAgo } from "@/lib/utils";
import type { DebtEntry } from "@/lib/types";

const fetchCustomers = makeCustomerSuggestionFetcher();

export default function LedgerPage() {
  const toast = useToast();
  const [entries, setEntries] = useState<DebtEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<DebtEntry | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<ListResponse<DebtEntry>>("/api/debt", {
        query: { name: search || undefined, date: date || undefined },
      });
      setEntries(data.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [search, date, toast]);

  useEffect(() => {
    // Replaced by TanStack Query in Phase 5; until then, fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const { totalBalance, outstanding } = useMemo(() => {
    let total = 0;
    let out = 0;
    for (const e of entries) {
      const b = Number(e.balance);
      total += b;
      if (b > 0) out += 1;
    }
    return { totalBalance: total, outstanding: out };
  }, [entries]);

  return (
    <>
      <main className="page">
        <PageHeader
          title="Ledger"
          description="Track customer debts and payments."
          aside={
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                Total outstanding
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--danger)" }}>
                {fmt(totalBalance)}
              </div>
            </div>
          }
        />

        <section className="stat-grid">
          <StatCard label="Total entries" value={entries.length} />
          <StatCard label="Outstanding" value={outstanding} tone="warning" />
          <StatCard label="Cleared" value={entries.length - outstanding} tone="success" />
        </section>

        <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <Autocomplete<string>
              label="Search customers"
              hideLabel
              inputType="search"
              placeholder="Search by customer name..."
              showSearchIcon
              value={search}
              onChange={setSearch}
              fetchSuggestions={fetchCustomers}
              renderOption={(s) => s}
              getOptionLabel={(s) => s}
            />
          </div>
          <input
            id="ledger-date"
            type="date"
            className="form-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ flex: 1, minWidth: 150 }}
            aria-label="Filter by date"
          />
          {date ? (
            <Button variant="ghost" onClick={() => setDate("")}>
              Reset
            </Button>
          ) : null}
        </div>

        {loading ? (
          <SkeletonList rows={4} rowHeight={140} />
        ) : entries.length === 0 ? (
          <EmptyState
            icon={LedgerIcon}
            title="No entries found"
            description="Tap the + button to record a new debt."
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {entries.map((e) => {
              const balance = Number(e.balance);
              const cleared = balance <= 0;
              return (
                <Card
                  key={e.id}
                  onClick={() => setSelected(e)}
                  style={{ display: "flex", flexDirection: "column", gap: "0.85rem", padding: "1.25rem", cursor: "pointer" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <div className="ledger-name">{e.customerName}</div>
                      <div className="ledger-meta">{e.creatorName} • {timeAgo(e.createdAt)}</div>
                    </div>
                    <Badge variant={cleared ? "success" : "danger"}>{cleared ? "Cleared" : "Outstanding"}</Badge>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                      padding: "0.6rem 0.85rem",
                      background: "var(--primary-soft)",
                      borderRadius: 8,
                    }}
                  >
                    <div>
                      <span className="ledger-amount-label">Debt</span>
                      <div style={{ fontWeight: 800 }}>{fmt(e.totalDebt)}</div>
                    </div>
                    <div>
                      <span className="ledger-amount-label">Balance</span>
                      <div style={{ fontWeight: 800, color: cleared ? "var(--success)" : "var(--danger)" }}>
                        {fmt(e.balance)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button variant="ghost" size="sm" onClick={(ev) => { ev.stopPropagation(); setSelected(e); }}>
                      {cleared ? "View payments" : "Record payment"}
                    </Button>
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
        aria-label="New debt entry"
      >
        <PlusIcon size={28} aria-hidden />
      </button>

      <AddDebtModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => {
          load();
          toast.success("Debt entry saved");
        }}
      />

      <RecordPaymentModal
        open={selected !== null}
        entry={selected}
        onClose={() => setSelected(null)}
        onSaved={() => {
          load();
          toast.success("Payment recorded");
        }}
      />
    </>
  );
}
