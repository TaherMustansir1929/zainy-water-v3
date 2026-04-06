import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { requireAdminAuthorization } from "../../utils/-server/admin-auth.function";
import { db } from "@/db";
import { Area, Moderator } from "@/db/schema";

const moderatorRecordSchema = z.object({
	id: z.string(),
	name: z.string(),
	password: z.string(),
	areas: z.array(z.enum(Area.enumValues)),
	isWorking: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export const moderatorDataSchema = z.object({
	name: z.string().trim().min(1, "Name is required."),
	password: z.string().trim().min(1, "Password is required."),
	areas: z.array(z.enum(Area.enumValues)).min(1, "At least one area is required."),
	isWorking: z.boolean(),
});

const updateModeratorSchema = z.object({
	name: z.string().trim().min(1),
	data: moderatorDataSchema,
});

const deleteModeratorSchema = z.object({
	name: z.string().trim().min(1),
});

const updateModeratorStatusSchema = z.object({
	name: z.string().trim().min(1),
	currentStatus: z.boolean(),
});

export const getModList = createServerFn({ method: "GET" })
	.inputValidator(z.void())
	.handler(async () => {
		await requireAdminAuthorization();

		try {
			const data = await db.select().from(Moderator);
			return z.array(moderatorRecordSchema).parse(data);
		} catch (error) {
			console.error("Error fetching moderators:", error);
			return [];
		}
	});

export const createModerator = createServerFn({ method: "POST" })
	.inputValidator(moderatorDataSchema)
	.handler(async ({ data }) => {
		await requireAdminAuthorization();

		const normalizedName = data.name.toLowerCase();

		const existingModerator = await db
			.select({ id: Moderator.id })
			.from(Moderator)
			.where(eq(Moderator.name, normalizedName))
			.limit(1);

		if (existingModerator.length > 0) {
			throw new Error(`Moderator with name ${data.name} already exists.`);
		}

		const inserted = await db
			.insert(Moderator)
			.values({
				name: normalizedName,
				password: data.password,
				areas: data.areas,
				isWorking: data.isWorking,
			})
			.returning();

		const newModerator = inserted.at(0);
		if (!newModerator) {
			throw new Error("Failed to create moderator.");
		}

		return moderatorRecordSchema.parse(newModerator);
	});

export const deleteModerator = createServerFn({ method: "POST" })
	.inputValidator(deleteModeratorSchema)
	.handler(async ({ data }) => {
		await requireAdminAuthorization();

		const normalizedName = data.name.toLowerCase();
		const moderatorToDelete = await db
			.select({ id: Moderator.id })
			.from(Moderator)
			.where(eq(Moderator.name, normalizedName))
			.limit(1);

		const moderator = moderatorToDelete.at(0);
		if (!moderator) {
			throw new Error(`Moderator with name ${data.name} not found.`);
		}

		await db.delete(Moderator).where(eq(Moderator.id, moderator.id));
	});

export const updateModerator = createServerFn({ method: "POST" })
	.inputValidator(updateModeratorSchema)
	.handler(async ({ data }) => {
		await requireAdminAuthorization();

		const originalName = data.name.toLowerCase();
		const nextName = data.data.name.toLowerCase();

		const updatedRows = await db
			.update(Moderator)
			.set({
				name: nextName,
				password: data.data.password,
				areas: data.data.areas,
				isWorking: data.data.isWorking,
			})
			.where(eq(Moderator.name, originalName))
			.returning();

		const updatedModerator = updatedRows.at(0);
		if (!updatedModerator) {
			throw new Error("Could not update moderator.");
		}

		return moderatorRecordSchema.parse(updatedModerator);
	});

export const updateModStatus = createServerFn({ method: "POST" })
	.inputValidator(updateModeratorStatusSchema)
	.handler(async ({ data }) => {
		await requireAdminAuthorization();

		const normalizedName = data.name.toLowerCase();

		const updatedRows = await db
			.update(Moderator)
			.set({
				isWorking: !data.currentStatus,
			})
			.where(eq(Moderator.name, normalizedName))
			.returning();

		const updatedModerator = updatedRows.at(0);
		if (!updatedModerator) {
			throw new Error(`Failed to change status for moderator: ${data.name}`);
		}

		return moderatorRecordSchema.parse(updatedModerator);
	});

export type ModeratorRecord = z.infer<typeof moderatorRecordSchema>;
export type ModeratorMutationInput = z.infer<typeof moderatorDataSchema>;
