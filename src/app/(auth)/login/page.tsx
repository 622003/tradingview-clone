"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <React.Suspense fallback={<Card><CardContent className="p-6 text-xs text-zinc-500">Loading…</CardContent></Card>}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [emailOrUsername, setEmailOrUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });
    const j = await res.json();
    setLoading(false);
    if (j.ok) {
      toast.success("Welcome back");
      router.push(params.get("next") || "/chart");
      router.refresh();
    } else {
      toast.error(j.error?.message ?? "Login failed");
    }
  }

  function loginAs(email: string, pass: string) {
    setEmailOrUsername(email);
    setPassword(pass);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-emerald-400" />
          TradeView
        </CardTitle>
        <CardDescription>Sign in to your account to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email or username</Label>
            <Input
              id="email"
              autoFocus
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-4 rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-xs text-zinc-400">
          <div className="mb-1 font-semibold text-zinc-300">Demo accounts</div>
          <ul className="space-y-1">
            <li className="flex items-center justify-between gap-2">
              <code>admin / admin1234</code>
              <Button size="sm" variant="ghost" onClick={() => loginAs("admin", "admin1234")}>
                Use
              </Button>
            </li>
            <li className="flex items-center justify-between gap-2">
              <code>pro / pro1234</code>
              <Button size="sm" variant="ghost" onClick={() => loginAs("pro", "pro1234")}>
                Use
              </Button>
            </li>
            <li className="flex items-center justify-between gap-2">
              <code>trader / user1234</code>
              <Button size="sm" variant="ghost" onClick={() => loginAs("trader", "user1234")}>
                Use
              </Button>
            </li>
          </ul>
        </div>

        <div className="mt-4 text-center text-xs text-zinc-400">
          New here?{" "}
          <Link href="/register" className="text-blue-400 hover:underline">
            Create an account
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
