"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface Idea {
  id: string;
  title: string;
  bias: string;
  createdAt: string;
  user: { username: string };
  symbol: { ticker: string } | null;
}

export default function AdminIdeasPage() {
  const [ideas, setIdeas] = React.useState<Idea[]>([]);
  async function load() {
    const res = await fetch("/api/ideas");
    const j = await res.json();
    if (j.ok) setIdeas(j.data);
  }
  React.useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this idea?")) return;
    const res = await fetch(`/api/admin/ideas/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) {
      toast.success("Deleted");
      load();
    }
  }

  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">Ideas moderation</h1>
        <p className="text-xs text-zinc-500">Remove inappropriate or off-topic posts.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All ideas ({ideas.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-xs">
            <thead className="text-[10px] uppercase text-zinc-500">
              <tr>
                <th className="px-3 py-2 text-left">Title</th>
                <th className="px-3 py-2">Author</th>
                <th className="px-3 py-2">Symbol</th>
                <th className="px-3 py-2">Bias</th>
                <th className="px-3 py-2">Posted</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {ideas.map((i) => (
                <tr key={i.id} className="border-t border-zinc-900">
                  <td className="px-3 py-2 text-zinc-100">{i.title}</td>
                  <td className="px-3 py-2 text-center text-zinc-400">@{i.user.username}</td>
                  <td className="px-3 py-2 text-center text-zinc-400 font-mono">{i.symbol?.ticker ?? "—"}</td>
                  <td className="px-3 py-2 text-center">
                    <Badge variant="info">{i.bias}</Badge>
                  </td>
                  <td className="px-3 py-2 text-center text-[10px] text-zinc-500">
                    {formatDistanceToNow(new Date(i.createdAt), { addSuffix: true })}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => remove(i.id)}>
                      Delete
                    </Button>
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
