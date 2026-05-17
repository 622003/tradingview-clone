import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return (
    <AppShell
      site="user"
      user={{ id: user.id, username: user.username, displayName: user.displayName, role: user.role }}
    >
      {children}
    </AppShell>
  );
}
