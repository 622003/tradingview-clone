"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface User {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AdminUsersPage() {
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [users, setUsers] = React.useState<User[]>([]);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (role) params.set("role", role);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/users?${params.toString()}`);
    const j = await res.json();
    if (j.ok) setUsers(j.data);
  }

  React.useEffect(() => {
    const t = setTimeout(load, 120);
    return () => clearTimeout(t);
  }, [q, role, status]);

  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">Users</h1>
        <p className="text-xs text-zinc-500">Manage roles, status and permissions.</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-2">
          <CardTitle className="flex-1">All users</CardTitle>
          <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="h-8 w-48" />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs"
          >
            <option value="">all roles</option>
            <option value="USER">USER</option>
            <option value="PRO">PRO</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-8 rounded-md border border-zinc-700 bg-zinc-900 px-2 text-xs"
          >
            <option value="">all statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="SUSPENDED">SUSPENDED</option>
            <option value="BANNED">BANNED</option>
          </select>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Email</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Joined</th>
                <th className="px-3 py-2">Last login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-zinc-900 hover:bg-zinc-900/40">
                  <td className="px-3 py-2">
                    <Link href={`/admin/users/${u.id}`}>
                      <div className="font-semibold text-zinc-100">{u.displayName ?? u.username}</div>
                      <div className="text-[10px] text-zinc-500">@{u.username}</div>
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-zinc-400">{u.email}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={u.role === "ADMIN" ? "warning" : u.role === "PRO" ? "info" : "default"}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant={u.status === "ACTIVE" ? "success" : u.status === "SUSPENDED" ? "warning" : "danger"}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-[10px] text-zinc-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2 text-[10px] text-zinc-500">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
