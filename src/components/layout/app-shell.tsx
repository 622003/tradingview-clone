import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/toaster";

interface ShellUser {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
}

export function AppShell({ user, children }: { user: ShellUser | null; children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar user={user} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto bg-zinc-950">{children}</main>
      </div>
      <Toaster />
    </div>
  );
}
