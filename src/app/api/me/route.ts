import { getCurrentUser } from "@/lib/auth/session";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return ok(null);
    return ok({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      bio: user.bio,
      maxAlerts: user.maxAlerts,
      maxWatchlists: user.maxWatchlists,
      canPostIdeas: user.canPostIdeas,
      canUseScreener: user.canUseScreener,
      canExportData: user.canExportData,
    });
  } catch (e) {
    return handleError(e);
  }
}
