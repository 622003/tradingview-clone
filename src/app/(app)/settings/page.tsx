"use client";

import * as React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="p-3">
      <div className="mb-3 px-1 text-lg font-semibold text-zinc-100">Settings</div>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-zinc-400">
            <p>Dark theme is currently the only theme. Light theme is planned — see CLAUDE.md.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-zinc-400">
            <p>Sign out of all browsers, or end this session.</p>
            <Button
              size="sm"
              variant="secondary"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                toast.success("Signed out");
                window.location.href = "/login";
              }}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
