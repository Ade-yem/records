import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/lib/components/Navigation";
import { getCurrentUser } from "@/lib/auth/server";
import { ServiceWorkerInit } from "@/components/ServiceWorkerInit";
import { InstallPrompt } from "@/components/InstallPrompt";
import { UserProvider } from "@/components/UserProvider";
import { ToastProvider } from "@/components/ToastProvider";
import { OfflineBanner } from "@/components/OfflineBanner";
import type { CurrentUser, UserRole } from "@/lib/types";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "ShopSync — Shop Ledger & Inventory",
  description: "Real-time debt ledger and inventory shortage tracker for shop staff",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ShopSync",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1A365D",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const sessionUser = await getCurrentUser();
  const currentUser: CurrentUser | null = sessionUser
    ? {
        id: sessionUser.id,
        email: sessionUser.email,
        name: (sessionUser as { name?: string | null }).name ?? null,
        image: (sessionUser as { image?: string | null }).image ?? null,
        role: sessionUser.role as UserRole,
      }
    : null;

  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <head>
        {/* Capture beforeinstallprompt before React hydrates so we never miss it */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaPrompt=e;});`,
          }}
        />
      </head>
      <body className="app-container">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <ServiceWorkerInit />
        <InstallPrompt />
        <OfflineBanner />
        <UserProvider user={currentUser}>
          <ToastProvider>
            {currentUser && <Navigation />}
            {children}
          </ToastProvider>
        </UserProvider>
      </body>
    </html>
  );
}
