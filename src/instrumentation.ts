import { validateProductionDatabaseConfig } from "@/lib/db";
import { validateAdminAuthConfig } from "@/lib/admin-auth";

export function register(): void {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.NEXT_RUNTIME === "nodejs"
  ) {
    validateProductionDatabaseConfig();
    validateAdminAuthConfig();
  }
}
