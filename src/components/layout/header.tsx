"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, LogOut, User, Settings as SettingsIcon, ShieldAlert, LineChart } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SearchDialog } from "@/components/layout/search-dialog";

export interface HeaderUser {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
}

/**
 * App header. On the user host it shows the search palette + auth controls;
 * on the admin host it swaps in a "Open user app" cross-host link instead.
 *
 * Cross-host URL is computed at runtime from window.location by swapping the
 * first hostname label (admin↔app), so we don't need to thread NEXT_PUBLIC_*
 * envs into every page that wants to render a link to the other site.
 */
export function Header({ user, site = "user" }: { user: HeaderUser | null; site?: "user" | "admin" }) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [otherSiteUrl, setOtherSiteUrl] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const host = window.location.host;
    const parts = host.split(".");
    if (parts.length < 2) return;
    const swapped = (site === "admin" ? ["app", ...parts.slice(1)] : ["admin", ...parts.slice(1)]).join(".");
    setOtherSiteUrl(`${window.location.protocol}//${swapped}`);
  }, [site]);

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  const isAdmin = site === "admin";

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-800 bg-zinc-950 px-3">
      {isAdmin ? (
        <div className="flex items-center gap-2">
          <Badge variant="warning">
            <ShieldAlert className="mr-1 h-3 w-3" />
            ADMIN CONSOLE
          </Badge>
          {otherSiteUrl && (
            <a
              href={`${otherSiteUrl}/chart`}
              className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
            >
              <LineChart className="h-3 w-3" />
              <span>Open user app</span>
            </a>
          )}
        </div>
      ) : (
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-400 hover:bg-zinc-800 md:w-72"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search symbols, ideas, news…</span>
          <kbd className="ml-auto rounded border border-zinc-700 px-1.5 py-0.5 text-[10px] text-zinc-500">⌘K</kbd>
        </button>
      )}

      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            {!isAdmin && user.role === "ADMIN" && otherSiteUrl && (
              <a href={`${otherSiteUrl}/admin`}>
                <Badge variant="warning" className="hidden md:inline-flex">
                  <ShieldAlert className="mr-1 h-3 w-3" />
                  ADMIN
                </Badge>
              </a>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-md p-1 hover:bg-zinc-900">
                  <Avatar>
                    <AvatarFallback>
                      {(user.displayName ?? user.username).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="font-semibold text-zinc-200">{user.displayName ?? user.username}</div>
                  <div className="text-[10px] font-normal text-zinc-500">@{user.username}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isAdmin && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center gap-2">
                        <SettingsIcon className="h-3.5 w-3.5" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {!isAdmin && user.role === "ADMIN" && otherSiteUrl && (
                  <DropdownMenuItem asChild>
                    <a href={`${otherSiteUrl}/admin`} className="flex items-center gap-2">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Admin console
                    </a>
                  </DropdownMenuItem>
                )}
                {isAdmin && otherSiteUrl && (
                  <DropdownMenuItem asChild>
                    <a href={`${otherSiteUrl}/chart`} className="flex items-center gap-2">
                      <LineChart className="h-3.5 w-3.5" />
                      User app
                    </a>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="text-rose-400">
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Log in</Link>
            </Button>
            {!isAdmin && (
              <Button asChild size="sm">
                <Link href="/register">Sign up</Link>
              </Button>
            )}
          </>
        )}
      </div>
      {!isAdmin && <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />}
    </header>
  );
}
