import cuid from "cuid";
import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, gte, isNull } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { Admin, DeveloperAccessKey } from "@/db/schema";

const DEVELOPER_KEY_TTL_MS = 24 * 60 * 60 * 1000;

const createDeveloperKeySchema = z.object({
  label: z.string().trim().min(1).max(255).optional(),
});

const deactivateDeveloperKeySchema = z.object({
  keyId: z.string().min(1, "Key id is required."),
});

async function requireAuthorizedAdmin() {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    throw new Error("Unauthorized.");
  }

  const adminRows = await db
    .select({ id: Admin.id })
    .from(Admin)
    .where(and(eq(Admin.clerk_id, userId), eq(Admin.isAuthorized, true)))
    .limit(1);

  const admin = adminRows.at(0);

  if (!admin) {
    throw new Error("Only authorized admins can manage developer keys.");
  }

  return { adminId: admin.id, clerkUserId: userId };
}

export const createDeveloperKey = createServerFn({ method: "POST" })
  .inputValidator(createDeveloperKeySchema)
  .handler(async ({ data }) => {
    const { clerkUserId } = await requireAuthorizedAdmin();

    const rawKey = `${clerkUserId}_${cuid()}`;
    const now = new Date();
    const expirationDate = new Date(now.getTime() + DEVELOPER_KEY_TTL_MS);

    const createdRows = await db
      .insert(DeveloperAccessKey)
      .values({
        label: data.label,
        developerKey: rawKey,
        expirationDate,
        usedByClerkId: clerkUserId,
        updatedAt: now,
      })
      .returning({
        id: DeveloperAccessKey.id,
        label: DeveloperAccessKey.label,
        expirationDate: DeveloperAccessKey.expirationDate,
      });

    const createdKey = createdRows.at(0);

    if (!createdKey) {
      throw new Error("Failed to create developer key.");
    }

    return {
      ...createdKey,
      keyPreview: `${rawKey.slice(0, 8)}...${rawKey.slice(-4)}`,
    };
  });

export const listDeveloperKeys = createServerFn({ method: "GET" }).handler(
  async () => {
    await requireAuthorizedAdmin();

    const now = new Date();

    return db
      .select({
        id: DeveloperAccessKey.id,
        label: DeveloperAccessKey.label,
        isActive: DeveloperAccessKey.isActive,
        createdAt: DeveloperAccessKey.createdAt,
        expirationDate: DeveloperAccessKey.expirationDate,
        usedAt: DeveloperAccessKey.usedAt,
        usedByClerkId: DeveloperAccessKey.usedByClerkId,
        revokedAt: DeveloperAccessKey.revokedAt,
      })
      .from(DeveloperAccessKey)
      .where(
        and(
          eq(DeveloperAccessKey.isActive, true),
          gte(DeveloperAccessKey.expirationDate, now),
          isNull(DeveloperAccessKey.revokedAt),
        ),
      );
  },
);

export const deactivateDeveloperKey = createServerFn({ method: "POST" })
  .inputValidator(deactivateDeveloperKeySchema)
  .handler(async ({ data }) => {
    await requireAuthorizedAdmin();

    const now = new Date();

    const updatedRows = await db
      .update(DeveloperAccessKey)
      .set({
        isActive: false,
        revokedAt: now,
        revokedReason: "Manually deactivated by admin.",
        updatedAt: now,
      })
      .where(eq(DeveloperAccessKey.id, data.keyId))
      .returning({ id: DeveloperAccessKey.id });

    return {
      success: updatedRows.length > 0,
    };
  });
