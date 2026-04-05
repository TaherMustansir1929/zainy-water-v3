ALTER TABLE "DeveloperAccessKey" DROP CONSTRAINT "DeveloperAccessKey_keyDigest_unique";--> statement-breakpoint
DROP INDEX "developer_access_key_digest_idx";--> statement-breakpoint
ALTER TABLE "DeveloperAccessKey" DROP COLUMN "keyDigest";--> statement-breakpoint
ALTER TABLE "DeveloperAccessKey" DROP COLUMN "keyHash";--> statement-breakpoint
ALTER TABLE "DeveloperAccessKey" DROP COLUMN "keySalt";--> statement-breakpoint
ALTER TABLE "DeveloperAccessKey" DROP COLUMN "hashVersion";