"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = React.useState({ email: "", username: "", password: "", displayName: "" });
  const [loading, setLoading] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    setLoading(false);
    if (j.ok) {
      toast.success("Account created");
      router.push("/chart");
      router.refresh();
    } else {
      toast.error(j.error?.message ?? "Registration failed");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-block h-6 w-6 rounded bg-gradient-to-br from-blue-500 to-emerald-400" />
          Create your account
        </CardTitle>
        <CardDescription>It’s free, no credit card needed.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={submit}>
          <Field id="email" label="Email" value={form.email} type="email" required
            onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
          <Field id="username" label="Username" value={form.username} required
            onChange={(v) => setForm((f) => ({ ...f, username: v }))} />
          <Field id="displayName" label="Display name (optional)" value={form.displayName}
            onChange={(v) => setForm((f) => ({ ...f, displayName: v }))} />
          <Field id="password" label="Password" value={form.password} type="password" required
            onChange={(v) => setForm((f) => ({ ...f, password: v }))} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating…" : "Create account"}
          </Button>
        </form>
        <div className="mt-4 text-center text-xs text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-blue-400 hover:underline">
            Log in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type ?? "text"} value={value} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}
