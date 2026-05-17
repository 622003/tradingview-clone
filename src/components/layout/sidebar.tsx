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

const NAV: { href: string; label: string; icon: React.ComponentType<{ className?: string }>; auth?: boolean }[] = [
  { href: "/chart", label: "Chart", icon: LineChart },
  { href: "/markets", label: "Markets", icon: Globe },
  { href: "/screener", label: "Screener", icon: Search },
  { href: "/watchlist", label: "Watchlist", icon: ListTree, auth: true },
  { href: "/news", label: "News", icon: Newspaper },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/alerts", label: "Alerts", icon: Bell, auth: true },
];

export function Sidebar({ user }: { user: SidebarUser | null }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-56 lg:w-60 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950">
      <div className="flex h-12 items-center gap-2 border-b border-zinc-800 px-4">
        <Link href="/" className="flex items-center gap-2 font-bold tracking-tight text-zinc-100">
          <span className="inline-block h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-emerald-400" />
          <span>TradeView</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-1">
          {NAV.map((item) => {
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

        {user?.role === "ADMIN" && (
          <>
            <div className="mt-6 mb-2 px-3 text-[10px] uppercase tracking-wide text-zinc-500">Admin</div>
            <ul className="space-y-1">
              <SidebarLink href="/admin" label="Dashboard" icon={ShieldAlert} active={pathname === "/admin"} />
              <SidebarLink href="/admin/users" label="Users" icon={User} active={pathname.startsWith("/admin/users")} />
              <SidebarLink
                href="/admin/symbols"
                label="Symbols"
                icon={Globe}
                active={pathname.startsWith("/admin/symbols")}
              />
              <SidebarLink
                href="/admin/ideas"
                label="Ideas"
                icon={Lightbulb}
                active={pathname.startsWith("/admin/ideas")}
              />
              <SidebarLink
                href="/admin/news"
                label="News"
                icon={Newspaper}
                active={pathname.startsWith("/admin/news")}
              />
              <SidebarLink
                href="/admin/audit"
                label="Audit log"
                icon={ListTree}
                active={pathname.startsWith("/admin/audit")}
              />
              <SidebarLink
                href="/admin/settings"
                label="Settings"
                icon={Settings}
                active={pathname.startsWith("/admin/settings")}
              />
            </ul>
          </>
        )}
      </nav>
      <div className="border-t border-zinc-800 p-3 text-[10px] text-zinc-500">
        v0.1 · demo data is simulated and not real market data.
      </div>
    </aside>
  );
}

function SidebarLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-colors",
          active ? "bg-zinc-800 text-zinc-50" : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100",
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        <span>{label}</span>
      </Link>
    </li>
  );
}
