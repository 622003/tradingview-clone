import { Toaster } from "@/components/ui/toaster";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full place-items-center bg-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-sm">{children}</div>
      <Toaster />
    </div>
  );
}
