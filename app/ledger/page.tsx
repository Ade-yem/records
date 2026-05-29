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
import { EditDebtModal } from "@/components/modals/EditDebtModal";
import { LedgerIcon, PlusIcon } from "@/components/Icon";
import { apiGet, ApiError, type ListResponse } from "@/lib/api/client";
import { fmt, timeAgo } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { User, Calendar } from "lucide-react";
import type { DebtEntry } from "@/lib/types";

const fetchCustomers = makeCustomerSuggestionFetcher();

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatFriendlyDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
};

// Short form used in the page header — won't wrap on small phones
const formatShortDate = (dateStr: string) => {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d); // e.g. "Mon 26 May 2025"
};

export default function LedgerPage() {
  const toast = useToast();
  const [entries, setEntries] = useState<DebtEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [date, setDate] = useState(getTodayString());
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<DebtEntry | null>(null);
  const [editing, setEditing] = useState<DebtEntry | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "outstanding" | "cleared">("all");

  // Debounce search to optimize API performance and database queries
  const debouncedSearch = useDebouncedValue(search, 300);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<ListResponse<DebtEntry>>("/api/debt", {
        query: { name: debouncedSearch || undefined, date: date || undefined },
      });
      setEntries(data.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load entries");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, date, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    if (value) {
      setDate(""); // Show full customer history by clearing date filter
    } else {
      setDate(getTodayString()); // Revert to today when search is cleared
    }
  }, []);

  const handleDateChange = useCallback((value: string) => {
    if (value) {
      setDate(value);
      setSearch(""); // Clear search to show all entries for this specific date
    } else {
      setDate(getTodayString()); // Default back to today if date is cleared
      setSearch("");
    }
  }, []);

  const { totalBalance, outstanding, filteredEntries } = useMemo(() => {
    let total = 0;
    let out = 0;
    for (const e of entries) {
      const b = Number(e.balance);
      total += b;
      if (b > 0) out += 1;
    }
    const filtered =
      statusFilter === "outstanding"
        ? entries.filter((e) => Number(e.balance) > 0)
        : statusFilter === "cleared"
        ? entries.filter((e) => Number(e.balance) <= 0)
        : entries;
    return { totalBalance: total, outstanding: out, filteredEntries: filtered };
  }, [entries, statusFilter]);

  const toggleStatusFilter = (f: "outstanding" | "cleared") =>
    setStatusFilter((prev) => (prev === f ? "all" : f));

  return (
    <>
      <main className="page">
        <PageHeader
          title="Ledger"
          description={
            search
              ? `"${search}" — all dates`
              : date === getTodayString()
              ? "Today's entries"
              : formatShortDate(date)
          }
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
          <StatCard label="Total entries" value={entries.length} onClick={() => setStatusFilter("all")} active={statusFilter === "all"} />
          <StatCard label="Outstanding" value={outstanding} tone="warning" onClick={() => toggleStatusFilter("outstanding")} active={statusFilter === "outstanding"} />
          <StatCard label="Cleared" value={entries.length - outstanding} tone="success" onClick={() => toggleStatusFilter("cleared")} active={statusFilter === "cleared"} />
        </section>

        <div style={{ display: "flex", gap: "1rem", marginBottom: search && !date ? "0.5rem" : "1.5rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <Autocomplete<string>
              label="Search customers"
              hideLabel
              inputType="search"
              placeholder="Search by customer name..."
              showSearchIcon
              value={search}
              onChange={handleSearchChange}
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
            onChange={(e) => handleDateChange(e.target.value)}
            style={{ flex: 1, minWidth: 150, opacity: search ? 0.45 : 1, transition: "opacity 0.2s" }}
            aria-label="Filter by date"
            disabled={!!search}
            title={search ? "Date filter is paused while searching by name" : undefined}
          />
          {date && date !== getTodayString() ? (
            <Button variant="ghost" onClick={() => handleDateChange("")}>
              Reset
            </Button>
          ) : null}
        </div>

        {/* Explain that searching by name shows all dates */}
        {search && !date ? (
          <p
            style={{
              fontSize: "0.8rem",
              color: "var(--text-muted)",
              marginBottom: "1.25rem",
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <Calendar size={13} aria-hidden style={{ flexShrink: 0 }} />
            Searching by name shows the full history across all dates. Select a date above to filter further.
          </p>
        ) : null}

        {/* ─── Active Filter Badges ───────────────────────────────────────── */}
        {(search || (date && date !== getTodayString())) && (
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              marginBottom: "1.5rem",
              flexWrap: "wrap",
              alignItems: "center",
              animation: "modal-slide-in 0.2s ease-out",
            }}
          >
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
              Active Filters:
            </span>
            {search && (
              <button
                type="button"
                className="badge badge-info filter-chip"
                onClick={() => handleSearchChange("")}
                aria-label={`Remove customer filter: ${search}`}
              >
                <User size={13} style={{ flexShrink: 0 }} aria-hidden /> Customer: {search}
                <span aria-hidden style={{ fontWeight: 800, fontSize: "0.85rem", opacity: 0.7 }}>&times;</span>
              </button>
            )}
            {date && date !== getTodayString() && (
              <button
                type="button"
                className="badge badge-warning filter-chip"
                onClick={() => handleDateChange("")}
                aria-label={`Remove date filter: ${formatFriendlyDate(date)}`}
              >
                <Calendar size={13} style={{ flexShrink: 0 }} aria-hidden /> Date: {formatFriendlyDate(date)}
                <span aria-hidden style={{ fontWeight: 800, fontSize: "0.85rem", opacity: 0.7 }}>&times;</span>
              </button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch("");
                setDate(getTodayString());
              }}
              style={{ padding: "4px 8px", fontSize: "0.75rem", height: "auto" }}
            >
              Clear All
            </Button>
          </div>
        )}

        {loading ? (
          <SkeletonList rows={4} rowHeight={140} />
        ) : filteredEntries.length === 0 ? (
          <EmptyState
            icon={LedgerIcon}
            title={
              statusFilter !== "all"
                ? `No ${statusFilter} entries`
                : search
                ? "No records found"
                : "No entries found today"
            }
            description={
              statusFilter !== "all"
                ? `No ${statusFilter} entries match the current filters.`
                : search
                ? `There are no recorded debts registered under "${search}".`
                : "No transactions or active debt entries were registered for today's date."
            }
            action={
              statusFilter !== "all" ? (
                <Button variant="ghost" onClick={() => setStatusFilter("all")}>Show all entries</Button>
              ) : search ? (
                <Button variant="primary" onClick={() => setShowAdd(true)}>
                  Create Debt for {search}
                </Button>
              ) : (
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                  {date !== getTodayString() ? (
                    <Button variant="ghost" onClick={() => handleDateChange("")}>
                      Reset to Today
                    </Button>
                  ) : null}
                  <Button variant="primary" onClick={() => setShowAdd(true)}>
                    Add Debt Entry
                  </Button>
                </div>
              )
            }
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredEntries.map((e, idx) => {
              const balance = Number(e.balance);
              const cleared = balance <= 0;
              const cardBg = idx % 2 === 0 ? "var(--row-white)" : "var(--row-blue)";
              return (
                <Card
                  key={e.id}
                  onClick={() => setSelected(e)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.85rem",
                    padding: "1.25rem",
                    cursor: "pointer",
                    background: cardBg,
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  className="ledger-card"
                  onMouseEnter={(el) => {
                    el.currentTarget.style.transform = "translateY(-2px)";
                    el.currentTarget.style.boxShadow = "var(--shadow-lg)";
                  }}
                  onMouseLeave={(el) => {
                    el.currentTarget.style.transform = "translateY(0)";
                    el.currentTarget.style.boxShadow = "var(--shadow-md)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                    <div>
                      <div className="ledger-name">{e.customerName}</div>
                      <div className="ledger-meta">
                        {e.creatorName} • {timeAgo(e.createdAt)}
                      </div>
                      {e.notes ? (
                        <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2, fontStyle: "italic" }}>
                          {e.notes}
                        </div>
                      ) : null}
                    </div>
                    <Badge variant={cleared ? "success" : "danger"}>{cleared ? "Cleared" : "Outstanding"}</Badge>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "1rem",
                      padding: "0.6rem 0.85rem",
                      background: "rgba(26, 54, 93, 0.04)",
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setSelected(e);
                      }}
                    >
                      {cleared ? "View payments" : "Record payment"}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <button className="fab" onClick={() => setShowAdd(true)} aria-label="New debt entry">
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
        onDeleted={() => {
          load();
          setSelected(null);
          toast.success("Entry deleted");
        }}
        onEdit={(entry) => {
          setSelected(null);
          setEditing(entry);
        }}
      />

      <EditDebtModal
        key={editing?.id}
        open={editing !== null}
        entry={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          load();
          toast.success("Debt entry updated");
        }}
      />
    </>
  );
}

