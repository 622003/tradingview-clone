import { destroyCurrentSession, getCurrentUser } from "@/lib/auth/session";
import { recordActivity } from "@/lib/admin/audit";
import { handleError, ok } from "@/lib/api";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) await recordActivity(user.id, "logout");
    await destroyCurrentSession();
    return ok({});
  } catch (e) {
    return handleError(e);
  }
}
