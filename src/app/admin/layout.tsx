import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "ADMIN") redirect("/chart");
  return (
    <AppShell user={{ id: user.id, username: user.username, displayName: user.displayName, role: user.role }}>
      {children}
    </AppShell>
  );
}
