import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";
import { redirect } from "next/navigation";
import { userSiteUrl } from "@/lib/hosts";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  // Non-admins on the admin host are bounced to the user app (cross-host) so
  // they don't loop between admin layout (redirect /chart) → middleware
  // (redirect / admin) forever.
  if (user.role !== "ADMIN") redirect(userSiteUrl("/chart"));
  return (
    <AppShell
      site="admin"
      user={{ id: user.id, username: user.username, displayName: user.displayName, role: user.role }}
    >
      {children}
    </AppShell>
  );
}
