"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";

interface News {
  id: string;
  title: string;
  source: string;
  summary: string;
  publishedAt: string;
  symbol?: { ticker: string } | null;
}

export default function AdminNewsPage() {
  const [news, setNews] = React.useState<News[]>([]);
  const [form, setForm] = React.useState({ title: "", summary: "", source: "Internal", url: "", ticker: "" });

  async function load() {
    const res = await fetch("/api/news");
    const j = await res.json();
    if (j.ok) setNews(j.data);
  }
  React.useEffect(() => {
    load();
  }, []);

  async function publish() {
    const res = await fetch("/api/admin/news", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...form, ticker: form.ticker || undefined, url: form.url || undefined }),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success("News published");
      setForm({ title: "", summary: "", source: "Internal", url: "", ticker: "" });
      load();
    } else {
      toast.error(j.error?.message ?? "Failed");
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this news item?")) return;
    const res = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
    const j = await res.json();
    if (j.ok) load();
  }

  return (
    <div className="p-3">
      <div className="mb-3 px-1">
        <h1 className="text-lg font-semibold text-zinc-100">News moderation</h1>
        <p className="text-xs text-zinc-500">Publish news items and curate the feed.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Publish</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Source</Label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              </div>
              <div>
                <Label>Ticker (optional)</Label>
                <Input value={form.ticker} onChange={(e) => setForm({ ...form, ticker: e.target.value.toUpperCase() })} />
              </div>
            </div>
            <div>
              <Label>URL (optional)</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
            </div>
            <div>
              <Label>Summary</Label>
              <Textarea rows={4} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
            </div>
            <Button onClick={publish}>Publish</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent news</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-2">
            {news.map((n) => (
              <div key={n.id} className="rounded border border-zinc-900 p-2 text-xs">
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                  <span>
                    {n.source} · {n.symbol?.ticker ?? "—"}
                  </span>
                  <Button size="sm" variant="ghost" className="text-rose-400" onClick={() => remove(n.id)}>
                    Delete
                  </Button>
                </div>
                <div className="font-semibold text-zinc-100">{n.title}</div>
                <div className="text-zinc-500">
                  {formatDistanceToNow(new Date(n.publishedAt), { addSuffix: true })}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
