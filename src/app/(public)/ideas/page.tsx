"use client";

import * as React from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Heart, MessageCircle, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";

interface Idea {
  id: string;
  title: string;
  content: string;
  bias: string;
  target: number | null;
  stop: number | null;
  createdAt: string;
  user: { username: string; displayName: string | null; role: string };
  symbol: { ticker: string } | null;
  _count: { likes: number; comments: number };
}

const BIAS_COLORS: Record<string, string> = {
  long: "success",
  short: "danger",
  neutral: "default",
  educational: "info",
};

export default function IdeasPage() {
  const [ideas, setIdeas] = React.useState<Idea[]>([]);
  const [me, setMe] = React.useState<{ id: string; canPostIdeas: boolean } | null>(null);
  const [composerOpen, setComposerOpen] = React.useState(false);

  async function load() {
    const res = await fetch("/api/ideas");
    const j = await res.json();
    if (j.ok) setIdeas(j.data);
  }
  React.useEffect(() => {
    load();
    fetch("/api/me")
      .then((r) => r.json())
      .then((j) => setMe(j.data));
  }, []);

  async function like(id: string) {
    if (!me) return toast.error("Log in to like ideas");
    await fetch(`/api/ideas/${id}/like`, { method: "POST" });
    load();
  }

  return (
    <div className="p-3">
      <div className="mb-3 flex items-end justify-between px-1">
        <div>
          <h1 className="text-lg font-semibold text-zinc-100">Ideas</h1>
          <p className="text-xs text-zinc-500">Published trade ideas from the community.</p>
        </div>
        {me?.canPostIdeas && (
          <Button onClick={() => setComposerOpen(true)} size="sm">
            <Plus className="mr-1 h-3.5 w-3.5" /> New idea
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {ideas.map((idea) => (
          <Card key={idea.id}>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-center gap-2 text-[10px] uppercase text-zinc-500">
                <Badge variant={(BIAS_COLORS[idea.bias] as never) || "default"}>{idea.bias}</Badge>
                {idea.symbol && (
                  <Link href={`/chart?symbol=${idea.symbol.ticker}`}>
                    <Badge variant="info">{idea.symbol.ticker}</Badge>
                  </Link>
                )}
                <span className="ml-auto text-zinc-500">
                  by @{idea.user.username} · {formatDistanceToNow(new Date(idea.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div className="text-sm font-semibold leading-snug text-zinc-100">{idea.title}</div>
              <div className="text-xs leading-relaxed text-zinc-400">{idea.content}</div>
              {(idea.target || idea.stop) && (
                <div className="flex gap-2 text-[10px] font-mono">
                  {idea.target && <Badge variant="success">Target {idea.target}</Badge>}
                  {idea.stop && <Badge variant="danger">Stop {idea.stop}</Badge>}
                </div>
              )}
              <div className="flex items-center gap-3 pt-2 text-xs text-zinc-500">
                <button onClick={() => like(idea.id)} className="flex items-center gap-1 hover:text-rose-400">
                  <Heart className="h-3.5 w-3.5" /> {idea._count.likes}
                </button>
                <span className="flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> {idea._count.comments}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {composerOpen && <Composer onClose={() => setComposerOpen(false)} onCreated={load} />}
    </div>
  );
}

function Composer({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [bias, setBias] = React.useState<"long" | "short" | "neutral" | "educational">("long");
  const [ticker, setTicker] = React.useState("");
  const [target, setTarget] = React.useState("");
  const [stop, setStop] = React.useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/ideas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        bias,
        ticker: ticker || undefined,
        target: target ? Number(target) : undefined,
        stop: stop ? Number(stop) : undefined,
      }),
    });
    const j = await res.json();
    if (j.ok) {
      toast.success("Idea published");
      onCreated();
      onClose();
    } else {
      toast.error(j.error?.message ?? "Failed");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-md border border-zinc-800 bg-zinc-950 p-4">
        <div className="mb-3 text-sm font-semibold text-zinc-100">Publish a new idea</div>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="ticker">Ticker (optional)</Label>
              <Input id="ticker" value={ticker} onChange={(e) => setTicker(e.target.value)} placeholder="AAPL" />
            </div>
            <div>
              <Label htmlFor="bias">Bias</Label>
              <select
                id="bias"
                value={bias}
                onChange={(e) => setBias(e.target.value as never)}
                className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-xs"
              >
                <option value="long">long</option>
                <option value="short">short</option>
                <option value="neutral">neutral</option>
                <option value="educational">educational</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="target">Target (optional)</Label>
              <Input id="target" type="number" value={target} onChange={(e) => setTarget(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="stop">Stop (optional)</Label>
              <Input id="stop" type="number" value={stop} onChange={(e) => setStop(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="content">Analysis</Label>
            <Textarea id="content" rows={6} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Publish
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
