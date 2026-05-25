"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useClickOutside } from "@/lib/hooks/useClickOutside";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { apiGet } from "@/lib/api/client";
import { SearchIcon } from "./Icon";

interface AutocompleteProps<T> {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (next: string) => void;
  onSelect?: (item: T) => void;
  fetchSuggestions: (query: string, signal: AbortSignal) => Promise<T[]>;
  renderOption: (item: T) => ReactNode;
  getOptionLabel: (item: T) => string;
  minChars?: number;
  debounceMs?: number;
  showSearchIcon?: boolean;
  id?: string;
  inputType?: "text" | "search";
  required?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  hideLabel?: boolean;
}

export function Autocomplete<T>({
  label,
  placeholder,
  value,
  onChange,
  onSelect,
  fetchSuggestions,
  renderOption,
  getOptionLabel,
  minChars = 1,
  debounceMs = 200,
  showSearchIcon = false,
  id,
  inputType = "text",
  required,
  autoFocus,
  disabled,
  hideLabel,
}: AutocompleteProps<T>) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const listboxId = `${fieldId}-listbox`;

  const wrapRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<T[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebouncedValue(value, debounceMs);

  useClickOutside(wrapRef, () => setOpen(false), open);

  useEffect(() => {
    if (debounced.trim().length < minChars) {
      // Reset suggestions when the query is too short. This is a sync
      // between an async data source and React state, not derivable.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    let cancelled = false;
    fetchSuggestions(debounced.trim(), ctrl.signal)
      .then((next) => {
        if (!cancelled) {
          setItems(next);
          setActiveIndex(-1);
        }
      })
      .catch((err) => {
        if ((err as Error).name === "AbortError") return;
        console.error("Autocomplete fetch failed", err);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [debounced, minChars, fetchSuggestions]);

  const pickItem = (item: T) => {
    onChange(getOptionLabel(item));
    onSelect?.(item);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      pickItem(items[activeIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const visible = open && items.length > 0;
  const activeId = visible && activeIndex >= 0 ? `${fieldId}-opt-${activeIndex}` : undefined;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {label && !hideLabel ? (
        <label htmlFor={fieldId} className="ledger-amount-label" style={{ display: "block", marginBottom: 6 }}>
          {label}
        </label>
      ) : null}
      <div style={{ position: "relative" }}>
        {showSearchIcon ? (
          <SearchIcon
            size={18}
            aria-hidden
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
              pointerEvents: "none",
            }}
          />
        ) : null}
        <input
          id={fieldId}
          type={inputType}
          className="form-input"
          placeholder={placeholder}
          value={value}
          required={required}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete="off"
          aria-label={hideLabel ? label : undefined}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visible}
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          style={showSearchIcon ? { paddingLeft: "2.5rem" } : undefined}
        />
      </div>
      {visible ? (
        <ul
          id={listboxId}
          role="listbox"
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid var(--border)",
            borderRadius: 8,
            marginTop: 4,
            zIndex: 10,
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
            listStyle: "none",
            padding: 0,
          }}
        >
          {items.map((item, idx) => {
            const active = idx === activeIndex;
            return (
              <li
                key={idx}
                id={`${fieldId}-opt-${idx}`}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pickItem(item);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                style={{
                  padding: "0.85rem 1rem",
                  borderBottom: "1px solid var(--border)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: 500,
                  background: active ? "var(--primary-soft)" : "transparent",
                }}
              >
                {renderOption(item)}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

// Convenience: typed suggestion fetchers
export function makeCustomerSuggestionFetcher() {
  return async (q: string, signal: AbortSignal) =>
    apiGet<string[]>(`/api/suggest`, { signal, query: { type: "customers", q } });
}

export function makeProductSuggestionFetcher<T>() {
  return async (q: string, signal: AbortSignal) =>
    apiGet<T[]>(`/api/suggest`, { signal, query: { type: "products", q } });
}
