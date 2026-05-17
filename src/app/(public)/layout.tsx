import { getCurrentUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/app-shell";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <AppShell
      user={user ? { id: user.id, username: user.username, displayName: user.displayName, role: user.role } : null}
    >
      {children}
    </AppShell>
  );
}
