"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LineChart,
  ListTree,
  Globe,
  Newspaper,
  Lightbulb,
  Search,
  Bell,
  User,
  Settings,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SidebarUser {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  auth?: boolean;
}

const USER_NAV: NavItem[] = [
  { href: "/chart", label: "Chart", icon: LineChart },
  { href: "/markets", label: "Markets", icon: Globe },
  { href: "/screener", label: "Screener", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: ListTree, auth: true },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/alerts", label: "Alerts", icon: Bell, auth: true },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: ShieldAlert },
  { href: "/admin/users", label: "Users", icon: User },
  { href: "/admin/symbols", label: "Symbols", icon: Globe },
  { href: "/admin/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/admin/news", label: "News", icon: Newspaper },
  { href: "/admin/audit", label: "Audit log", icon: ListTree },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ user, site = "user" }: { user: SidebarUser | null; site?: "user" | "admin" }) {
  const pathname = usePathname();
  const isAdminSite = site === "admin";
  const items = isAdminSite ? ADMIN_NAV : USER_NAV;
  const brandLabel = isAdminSite ? "TradeView Admin" : "TradeView";
  const brandHref = isAdminSite ? "/admin" : "/chart";
  const brandSwatch = isAdminSite
    ? "bg-gradient-to-br from-rose-500 to-amber-400"
    : "bg-gradient-to-br from-blue-500 to-emerald-400";

  return (
    <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-12 items-center gap-2 border-b border-zinc-800 px-4">
        <Link href={brandHref} className="flex items-center gap-2 font-bold tracking-tight text-zinc-100">
          <span className={cn("inline-block h-6 w-6 rounded", brandSwatch)} />
          <span>{brandLabel}</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-1">
          {items.map((item) => {
            if (item.auth && !user) return null;
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-zinc-800 text-zinc-50"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-zinc-800 p-3 text-[10px] text-zinc-500">
        v0.2 ·{" "}
        {isAdminSite ? "admin console — careful with destructive actions" : "demo data is simulated"}
      </div>
    </aside>
  );
}
