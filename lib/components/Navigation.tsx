"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "./action";
import { useCurrentUser } from "@/components/UserProvider";
import {
  LedgerIcon,
  InventoryIcon,
  PricesIcon,
  UsersIcon,
  ProfileIcon,
  SignOutIcon,
  type IconComponent,
} from "@/components/Icon";

interface NavItem {
  href: string;
  label: string;
  icon: IconComponent;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { href: "/ledger", label: "Ledger", icon: LedgerIcon },
  { href: "/inventory", label: "Inventory", icon: InventoryIcon },
  { href: "/products", label: "Prices", icon: PricesIcon },
  { href: "/profile", label: "Account", icon: ProfileIcon },
];

export function Navigation() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const isAdmin = user?.role === "admin";

  const navItems: NavItem[] = [...BASE_NAV_ITEMS];
  if (isAdmin) {
    navItems.splice(3, 0, { href: "/admin/users", label: "Users", icon: UsersIcon });
  }

  return (
    <>
      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`nav-item ${isActive ? "active" : ""}`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={24} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <aside className="desktop-sidebar">
        <div className="sidebar-logo">
          <div
            style={{
              width: 36,
              height: 36,
              background: "white",
              color: "var(--primary)",
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
            }}
          >
            SS
          </div>
          ShopSync
        </div>
        <nav className="sidebar-nav" aria-label="Primary">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon size={20} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>

        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1.5rem" }}>
          <button
            type="button"
            onClick={() => signOut()}
            className="sidebar-item"
            style={{
              color: "#FC8181",
              background: "transparent",
              border: "none",
              width: "100%",
              cursor: "pointer",
              font: "inherit",
              textAlign: "left",
            }}
          >
            <SignOutIcon size={20} aria-hidden />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
