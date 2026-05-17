"use client";
import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "border border-zinc-800 bg-zinc-950 text-zinc-100",
        },
      }}
    />
  );
}
