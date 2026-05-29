"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCanEditProducts, useIsAdmin } from "@/components/UserProvider";
import { useToast } from "@/components/ToastProvider";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonList } from "@/components/Skeleton";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Autocomplete } from "@/components/Autocomplete";
import { ProductModal } from "@/components/modals/ProductModal";
import { EditIcon, PlusIcon, PricesIcon, TrashIcon } from "@/components/Icon";
import { apiGet, apiDelete, ApiError, type ListResponse } from "@/lib/api/client";
import { fmt } from "@/lib/utils";
import { useSearchShortcut } from "@/lib/hooks/useSearchShortcut";
import type { Product } from "@/lib/types";

type SortKey = "name-asc" | "name-desc" | "price-unit-asc" | "price-unit-desc";

export default function ProductsPage() {
  const canEdit = useCanEditProducts();
  const isAdmin = useIsAdmin();
  const toast = useToast();

  const searchRef = useSearchShortcut();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("name-asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<ListResponse<Product>>("/api/products");
      setProducts(data.items);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // Replaced by TanStack Query in Phase 5; until then, fetch on mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = q ? products.filter((p) => p.name.toLowerCase().includes(q)) : products;
    return [...result].sort((a, b) => {
      if (sort === "name-desc") return b.name.localeCompare(a.name);
      if (sort === "price-unit-asc") return Number(a.priceUnit) - Number(b.priceUnit);
      if (sort === "price-unit-desc") return Number(b.priceUnit) - Number(a.priceUnit);
      return a.name.localeCompare(b.name); // name-asc default
    });
  }, [products, search, sort]);

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await apiDelete(`/api/products/${confirmDelete.id}`);
      toast.success(`${confirmDelete.name} deleted`);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete product");
    } finally {
      setConfirmDelete(null);
    }
  };

  const localFetch = useCallback(
    async (q: string) => {
      const qq = q.toLowerCase();
      return products
        .filter((p) => p.name.toLowerCase().includes(qq))
        .map((p) => p.name)
        .slice(0, 5);
    },
    [products],
  );

  return (
    <>
      <main className="page">
        <PageHeader
          title="Products & prices"
          description={
            loading
              ? "Loading catalog…"
              : search && filtered.length !== products.length
              ? `${filtered.length} of ${products.length} ${products.length === 1 ? "product" : "products"}`
              : `${products.length} ${products.length === 1 ? "product" : "products"} in catalog`
          }
        />

        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", alignItems: "center" }}>
          <div ref={searchRef} style={{ flex: 1 }}>
            <Autocomplete<string>
              label="Search products"
              hideLabel
              inputType="search"
              placeholder="Search items…  ( / )"
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
            aria-label="Sort products"
            style={{ width: "auto", flexShrink: 0 }}
          >
            <option value="name-asc">Name A–Z</option>
            <option value="name-desc">Name Z–A</option>
            <option value="price-unit-asc">Price ↑</option>
            <option value="price-unit-desc">Price ↓</option>
          </select>
        </div>

        {loading ? (
          <SkeletonList rows={3} rowHeight={140} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={PricesIcon}
            title={search ? "No products match your search" : "No products yet"}
            description={
              search
                ? `No products found for "${search}".`
                : canEdit
                ? "Tap the + button to add products and set prices."
                : "No products have been added to the catalog yet. Ask your price manager or admin to add items."
            }
            action={canEdit ? (
              <Button variant="primary" leadingIcon={<PlusIcon size={16} aria-hidden />} onClick={() => { setEditing(null); setModalOpen(true); }}>
                Add product
              </Button>
            ) : undefined}
          />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filtered.map((p) => (
              <Card key={p.id} style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem" }}>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "var(--primary)" }}>{p.name}</h3>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    padding: "0.75rem 1rem",
                    background: "var(--primary-soft)",
                    borderRadius: 8,
                  }}
                >
                  <div>
                    <span className="ledger-amount-label">Unit price</span>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                      {fmt(p.priceUnit)}{" "}
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>/ {p.unitName || "pcs"}</span>
                    </div>
                  </div>
                  <div>
                    <span className="ledger-amount-label">Bulk price</span>
                    <div style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                      {fmt(p.priceBulk)}{" "}
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontWeight: 500 }}>/ {p.bulkName || "carton"}</span>
                    </div>
                  </div>
                </div>

                {(canEdit || isAdmin) ? (
                  <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                    {canEdit ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        leadingIcon={<EditIcon size={14} aria-hidden />}
                        onClick={() => { setEditing(p); setModalOpen(true); }}
                      >
                        Edit
                      </Button>
                    ) : null}
                    {isAdmin ? (
                      <Button
                        variant="danger"
                        size="sm"
                        leadingIcon={<TrashIcon size={14} aria-hidden />}
                        onClick={() => setConfirmDelete(p)}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </main>

      {canEdit ? (
        <button
          className="fab"
          onClick={() => { setEditing(null); setModalOpen(true); }}
          aria-label="Add new product"
        >
          <PlusIcon size={28} aria-hidden />
        </button>
      ) : null}

      <ProductModal
        key={editing?.id ?? "new"}
        open={modalOpen}
        product={editing}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSaved={(mode) => {
          load();
          toast.success(mode === "create" ? "Product added" : "Product updated");
        }}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete product?"
        description={confirmDelete ? `${confirmDelete.name} will be removed from the catalog.` : undefined}
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  );
}
