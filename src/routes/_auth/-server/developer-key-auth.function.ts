import cuid from "cuid";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { and, eq, gt } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { Admin, DeveloperAccessKey } from "@/db/schema";

const DEVELOPER_KEY_TTL_MS = 24 * 60 * 60 * 1000;

const developerKeySchema = z.object({
  developerKey: z
    .string()
    .trim()
    .min(1, "Developer key is required."),
});

function buildDeveloperKey(clerkUserId: string) {
  return `${clerkUserId}_${cuid()}`;
}

async function resolveAdminNameFromClerkUser(clerkUserId: string) {
  try {
    const user = await clerkClient().users.getUser(clerkUserId);

    const fullName = [user.firstName?.trim(), user.lastName?.trim()]
      .filter(Boolean)
      .join(" ")
      .trim();

    if (fullName) {
      return fullName;
    }

    if (user.username?.trim()) {
      return user.username.trim();
    }

    const primaryEmail = user.emailAddresses
      .find((emailAddress) => emailAddress.id === user.primaryEmailAddressId)
      ?.emailAddress.trim();

    if (primaryEmail) {
      return primaryEmail;
    }
  } catch {
    // Fall back to a stable value if Clerk user lookup fails.
  }

  return clerkUserId;
}

async function findOrCreateAdminForUser(args: {
  clerkUserId: string;
}) {
  const { clerkUserId } = args;
  const now = new Date();

  const adminRows = await db
    .select({
      id: Admin.id,
      name: Admin.name,
      isAuthorized: Admin.isAuthorized,
      authorizedByKeyId: Admin.authorizedByKeyId,
    })
    .from(Admin)
    .where(eq(Admin.clerk_id, clerkUserId))
    .limit(1);

  const existingAdmin = adminRows.at(0);

  if (existingAdmin) {
    if (existingAdmin.name === clerkUserId) {
      const resolvedName = await resolveAdminNameFromClerkUser(clerkUserId);

      if (resolvedName !== existingAdmin.name) {
        await db
          .update(Admin)
          .set({
            name: resolvedName,
            updatedAt: now,
          })
          .where(eq(Admin.id, existingAdmin.id));
      }
    }

    return existingAdmin;
  }

  const adminName = await resolveAdminNameFromClerkUser(clerkUserId);

  const insertedAdminRows = await db
    .insert(Admin)
    .values({
      name: adminName,
      clerk_id: clerkUserId,
      isAuthorized: false,
      updatedAt: now,
    })
    .returning({
      id: Admin.id,
      isAuthorized: Admin.isAuthorized,
      authorizedByKeyId: Admin.authorizedByKeyId,
    });

  const insertedAdmin = insertedAdminRows.at(0);

  if (!insertedAdmin) {
    throw new Error("Failed to initialize admin profile.");
  }

  return insertedAdmin;
}

async function getOrCreateDeveloperKeyForAdmin(args: {
  clerkUserId: string;
  adminId: string;
  authorizedByKeyId: string | null;
}) {
  const { clerkUserId, adminId, authorizedByKeyId } = args;
  const now = new Date();

  if (authorizedByKeyId) {
    const existingKeyRows = await db
      .select({
        id: DeveloperAccessKey.id,
        developerKey: DeveloperAccessKey.developerKey,
        expirationDate: DeveloperAccessKey.expirationDate,
      })
      .from(DeveloperAccessKey)
      .where(
        and(
          eq(DeveloperAccessKey.id, authorizedByKeyId),
          eq(DeveloperAccessKey.isActive, true),
          gt(DeveloperAccessKey.expirationDate, now),
        ),
      )
      .limit(1);

    const existingKey = existingKeyRows.at(0);
    if (
      existingKey &&
      existingKey.developerKey.startsWith(`${clerkUserId}_`)
    ) {
      return existingKey;
    }
  }

  const nextDeveloperKey = buildDeveloperKey(clerkUserId);
  const expirationDate = new Date(now.getTime() + DEVELOPER_KEY_TTL_MS);

  const createdKeyRows = await db
    .insert(DeveloperAccessKey)
    .values({
      developerKey: nextDeveloperKey,
      expirationDate,
      isActive: true,
      usedByClerkId: clerkUserId,
      updatedAt: now,
    })
    .returning({
      id: DeveloperAccessKey.id,
      developerKey: DeveloperAccessKey.developerKey,
      expirationDate: DeveloperAccessKey.expirationDate,
    });

  const createdKey = createdKeyRows.at(0);

  if (!createdKey) {
    throw new Error("Failed to create developer key.");
  }

  await db
    .update(Admin)
    .set({
      authorizedByKeyId: createdKey.id,
      updatedAt: now,
    })
    .where(eq(Admin.id, adminId));

  return createdKey;
}

export const getCallbackState = createServerFn({ method: "GET" }).handler(async () => {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated || !userId) {
    throw redirect({
      to: "/sign-in/$",
    });
  }

  const currentAdmin = await findOrCreateAdminForUser({ clerkUserId: userId });

  await getOrCreateDeveloperKeyForAdmin({
    clerkUserId: userId,
    adminId: currentAdmin.id,
    authorizedByKeyId: currentAdmin.authorizedByKeyId ?? null,
  });

  if (currentAdmin.isAuthorized) {
    throw redirect({
      to: "/admin/dashboard",
    });
  }

  return { userId };
});

export const activateAdminWithDeveloperKey = createServerFn({ method: "POST" })
  .inputValidator(developerKeySchema)
  .handler(async ({ data }) => {
    const { isAuthenticated, userId } = await auth();

    if (!isAuthenticated || !userId) {
      throw redirect({
        to: "/sign-in/$",
      });
    }

    const now = new Date();
    const normalizedKey = data.developerKey.trim();

    return db.transaction(async (tx) => {
      const currentAdminRows = await tx
        .select({
          id: Admin.id,
          authorizedByKeyId: Admin.authorizedByKeyId,
        })
        .from(Admin)
        .where(eq(Admin.clerk_id, userId))
        .limit(1);

      const currentAdmin = currentAdminRows.at(0);

      if (!currentAdmin) {
        throw new Error("Admin profile not found.");
      }

      const matchedKeyRows = await tx
        .select({
          id: DeveloperAccessKey.id,
          developerKey: DeveloperAccessKey.developerKey,
          expirationDate: DeveloperAccessKey.expirationDate,
        })
        .from(DeveloperAccessKey)
        .where(
          and(
            eq(DeveloperAccessKey.id, currentAdmin.authorizedByKeyId ?? ""),
            eq(DeveloperAccessKey.isActive, true),
            gt(DeveloperAccessKey.expirationDate, now),
          ),
        )
        .limit(1);

      const matchedKey = matchedKeyRows.at(0);

      if (!matchedKey) {
        throw new Error("Developer key is invalid or expired.");
      }

      if (normalizedKey !== matchedKey.developerKey) {
        throw new Error("Developer key is invalid.");
      }

      await tx
        .update(Admin)
        .set({
          isAuthorized: true,
          authorizedByKeyId: matchedKey.id,
          authorizedAt: now,
          updatedAt: now,
        })
        .where(eq(Admin.id, currentAdmin.id));

      const consumedKeyRows = await tx
        .update(DeveloperAccessKey)
        .set({
          usedAt: now,
          usedByClerkId: userId,
          usedByAdminId: currentAdmin.id,
          updatedAt: now,
        })
        .where(eq(DeveloperAccessKey.id, matchedKey.id))
        .returning({ id: DeveloperAccessKey.id });

      if (consumedKeyRows.length === 0) {
        throw new Error("Failed to update developer key usage details.");
      }

      return { success: true };
    });
  });
