import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { redirect } from "@tanstack/react-router";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { Admin } from "@/db/schema";

export const requireAdminAuthorization = createServerFn({ method: "GET" }).handler(
  async () => {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      throw redirect({
        to: "/sign-in/$",
      });
    }

    const adminRows = await db
      .select({
        id: Admin.id,
        isAuthorized: Admin.isAuthorized,
      })
      .from(Admin)
      .where(eq(Admin.clerk_id, userId))
      .limit(1);

    const admin = adminRows.at(0);

    if (!admin || !admin.isAuthorized) {
      throw redirect({
        to: "/callback",
      });
    }

    return {
      userId,
      adminId: admin.id,
    };
  },
);
