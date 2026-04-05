import crypto from "node:crypto";
import { and, eq, ilike } from "drizzle-orm";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { setResponseStatus } from "@tanstack/react-start/server";
import { z } from "zod";

import { db } from "@/db";
import { Moderator } from "@/db/schema";
import { moderatorLoginSchema } from "@/lib/schemas/moderator-login";

const SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const MAX_LOGIN_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 1000 * 60 * 15;
const COOLDOWN_MS = 1000 * 5;
const HASH_PREFIX = "scrypt";
const SESSION_HMAC_ALGORITHM = "sha256";

const MODERATOR_SESSION_SECRET =
	process.env.MODERATOR_SESSION_SECRET ??
	process.env.SESSION_SECRET ??
	"dev-only-change-me-moderator-session-secret";

type LoginAttemptRecord = {
	count: number;
	firstAttemptAt: number;
	lockedUntil: number;
};

type ModeratorSessionPayload = {
	moderatorId: string;
	issuedAt: number;
	expiresAt: number;
};

const loginAttempts = new Map<string, LoginAttemptRecord>();
const revokedModeratorSessionTokens = new Map<string, number>();

const moderatorSessionTokenSchema = z.object({
	sessionToken: z.string().min(1, "Session token is required."),
}).passthrough();

function safeEqual(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left);
	const rightBuffer = Buffer.from(right);

	if (leftBuffer.length !== rightBuffer.length) {
		return false;
	}

	return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function toBase64Url(value: string): string {
	return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
	return Buffer.from(value, "base64url").toString("utf8");
}

function signSessionPayload(payload: string): string {
	return crypto
		.createHmac(SESSION_HMAC_ALGORITHM, MODERATOR_SESSION_SECRET)
		.update(payload)
		.digest("base64url");
}

function createSessionToken(payload: ModeratorSessionPayload): string {
	const payloadString = JSON.stringify(payload);
	const encodedPayload = toBase64Url(payloadString);
	const signature = signSessionPayload(encodedPayload);
	return `${encodedPayload}.${signature}`;
}

function readSessionToken(sessionToken: string): ModeratorSessionPayload | null {
	const parts = sessionToken.split(".");
	if (parts.length !== 2) {
		return null;
	}

	const [encodedPayload, signature] = parts;
	if (!encodedPayload || !signature) {
		return null;
	}

	const expectedSignature = signSessionPayload(encodedPayload);
	if (!safeEqual(signature, expectedSignature)) {
		return null;
	}

	try {
		const parsedPayload = JSON.parse(
			fromBase64Url(encodedPayload),
		) as ModeratorSessionPayload;

		if (
			typeof parsedPayload.moderatorId !== "string" ||
			typeof parsedPayload.issuedAt !== "number" ||
			typeof parsedPayload.expiresAt !== "number"
		) {
			return null;
		}

		return parsedPayload;
	} catch {
		return null;
	}
}

function revokeSessionToken(sessionToken: string, expiresAt: number): void {
	revokedModeratorSessionTokens.set(sessionToken, expiresAt);
}

function isSessionTokenRevoked(sessionToken: string): boolean {
	const expiresAt = revokedModeratorSessionTokens.get(sessionToken);
	if (!expiresAt) {
		return false;
	}

	if (expiresAt <= Date.now()) {
		revokedModeratorSessionTokens.delete(sessionToken);
		return false;
	}

	return true;
}

function hashPassword(password: string, salt?: string): string {
	const derivedSalt = salt ?? crypto.randomBytes(16).toString("hex");
	const hash = crypto.scryptSync(password, derivedSalt, 64).toString("hex");
	return `${HASH_PREFIX}$${derivedSalt}$${hash}`;
}

function verifyScryptPassword(password: string, storedHash: string): boolean {
	const [prefix, salt, hash] = storedHash.split("$");

	if (prefix !== HASH_PREFIX || !salt || !hash) {
		return false;
	}

	const calculatedHash = crypto
		.scryptSync(password, salt, Buffer.from(hash, "hex").length)
		.toString("hex");

	return safeEqual(calculatedHash, hash);
}

function isScryptHash(value: string): boolean {
	return value.startsWith(`${HASH_PREFIX}$`);
}

function getAttemptsKey(name: string): string {
	return name.toLocaleLowerCase("en-US");
}

function getAttemptsState(key: string): LoginAttemptRecord {
	const now = Date.now();
	const existing = loginAttempts.get(key);

	if (!existing || now - existing.firstAttemptAt > ATTEMPT_WINDOW_MS) {
		const fresh = { count: 0, firstAttemptAt: now, lockedUntil: 0 };
		loginAttempts.set(key, fresh);
		return fresh;
	}

	return existing;
}

function markFailedAttempt(key: string): LoginAttemptRecord {
	const state = getAttemptsState(key);
	const now = Date.now();

	state.count += 1;
	if (state.count >= MAX_LOGIN_ATTEMPTS) {
		state.lockedUntil = now + COOLDOWN_MS * (state.count - MAX_LOGIN_ATTEMPTS + 1);
	}

	loginAttempts.set(key, state);
	return state;
}

function clearAttempts(key: string): void {
	loginAttempts.delete(key);
}

async function verifyModeratorPassword(args: {
	moderatorId: string;
	storedPassword: string;
	inputPassword: string;
}): Promise<boolean> {
	const { moderatorId, storedPassword, inputPassword } = args;

	if (isScryptHash(storedPassword)) {
		return verifyScryptPassword(inputPassword, storedPassword);
	}

	const isValidLegacyPassword = safeEqual(storedPassword, inputPassword);
	if (!isValidLegacyPassword) {
		return false;
	}

	await db
		.update(Moderator)
		.set({
			password: hashPassword(inputPassword),
			updatedAt: new Date(),
		})
		.where(eq(Moderator.id, moderatorId));

	return true;
}

export const requireModeratorAuthMiddleware = createMiddleware({ type: "function" })
	.inputValidator(moderatorSessionTokenSchema)
	.server(async ({ data, next }) => {
		const sessionPayload = readSessionToken(data.sessionToken);
		if (!sessionPayload || sessionPayload.expiresAt <= Date.now()) {
			setResponseStatus(401);
			throw new Error("Session expired. Please sign in again.");
		}

		if (isSessionTokenRevoked(data.sessionToken)) {
			setResponseStatus(401);
			throw new Error("Session is no longer valid. Please sign in again.");
		}

		const moderators = await db
			.select({
				id: Moderator.id,
				name: Moderator.name,
				areas: Moderator.areas,
			})
			.from(Moderator)
			.where(
				and(
					eq(Moderator.id, sessionPayload.moderatorId),
					eq(Moderator.isWorking, true),
				),
			)
			.limit(1);

		if (moderators.length === 0) {
			setResponseStatus(401);
			throw new Error("Moderator account is unavailable.");
		}

		const moderator = moderators[0];

		return next({
			context: {
				moderator,
				moderatorSession: sessionPayload,
			},
		});
	});

export const moderatorLogin = createServerFn({ method: "POST" })
	.inputValidator(moderatorLoginSchema)
	.handler(async ({ data }) => {
		const normalizedName = data.name.trim();
		const attemptsKey = getAttemptsKey(normalizedName);
		const attemptsState = getAttemptsState(attemptsKey);
		const now = Date.now();

		if (attemptsState.lockedUntil > now) {
			setResponseStatus(429);
			throw new Error("Too many login attempts. Please wait and try again.");
		}

		const moderators = await db
			.select({
				id: Moderator.id,
				name: Moderator.name,
				areas: Moderator.areas,
				password: Moderator.password,
			})
			.from(Moderator)
			.where(
				and(
					ilike(Moderator.name, normalizedName),
					eq(Moderator.isWorking, true),
				),
			)
			.limit(1);

		if (moderators.length === 0) {
			markFailedAttempt(attemptsKey);
			setResponseStatus(401);
			throw new Error("Invalid credentials.");
		}

		const moderator = moderators[0];

		const isValidPassword = await verifyModeratorPassword({
			moderatorId: moderator.id,
			storedPassword: moderator.password,
			inputPassword: data.password,
		});

		if (!isValidPassword) {
			markFailedAttempt(attemptsKey);
			setResponseStatus(401);
			throw new Error("Invalid credentials.");
		}

		clearAttempts(attemptsKey);

		const issuedAt = Date.now();
		const expiresAt = issuedAt + SESSION_TTL_MS;
		const sessionToken = createSessionToken({
			moderatorId: moderator.id,
			issuedAt,
			expiresAt,
		});

		return {
			moderator: {
				id: moderator.id,
				name: moderator.name,
				areas: moderator.areas,
			},
			issuedAt,
			expiresAt,
			sessionToken,
		};
	});

export const getModeratorSession = createServerFn({ method: "POST" })
	.middleware([requireModeratorAuthMiddleware])
	.handler(async ({ context }) => {
		return {
			moderator: context.moderator,
			issuedAt: context.moderatorSession.issuedAt,
			expiresAt: context.moderatorSession.expiresAt,
		};
	});

export const moderatorLogout = createServerFn({ method: "POST" })
	.inputValidator(moderatorSessionTokenSchema)
	.handler(async ({ data }) => {
		const sessionPayload = readSessionToken(data.sessionToken);
		if (sessionPayload && sessionPayload.expiresAt > Date.now()) {
			revokeSessionToken(data.sessionToken, sessionPayload.expiresAt);
		}

		return {
			success: true,
		};
	});

export const modMiddleware = moderatorLogin;