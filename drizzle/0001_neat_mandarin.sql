CREATE TABLE "DeveloperAccessKey" (
	"id" varchar PRIMARY KEY NOT NULL,
	"label" varchar(255),
	"keyDigest" varchar(64) NOT NULL,
	"keyHash" text NOT NULL,
	"keySalt" varchar(255) NOT NULL,
	"hashVersion" varchar(32) DEFAULT 'scrypt-v1' NOT NULL,
	"expiresAt" timestamp with time zone NOT NULL,
	"usedAt" timestamp with time zone,
	"usedByClerkId" varchar(255),
	"usedByAdminId" varchar,
	"isActive" boolean DEFAULT true NOT NULL,
	"revokedAt" timestamp with time zone,
	"revokedReason" text,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "DeveloperAccessKey_keyDigest_unique" UNIQUE("keyDigest")
);
--> statement-breakpoint
ALTER TABLE "Admin" ADD COLUMN "authorizedByKeyId" varchar;--> statement-breakpoint
ALTER TABLE "Admin" ADD COLUMN "authorizedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "DeveloperAccessKey" ADD CONSTRAINT "developer_access_key_used_by_admin_fk" FOREIGN KEY ("usedByAdminId") REFERENCES "public"."Admin"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "developer_access_key_id_idx" ON "DeveloperAccessKey" USING btree ("id");--> statement-breakpoint
CREATE INDEX "developer_access_key_digest_idx" ON "DeveloperAccessKey" USING btree ("keyDigest");--> statement-breakpoint
CREATE INDEX "developer_access_key_expires_at_idx" ON "DeveloperAccessKey" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "developer_access_key_is_active_idx" ON "DeveloperAccessKey" USING btree ("isActive");--> statement-breakpoint
CREATE INDEX "admin_authorized_by_key_id_idx" ON "Admin" USING btree ("authorizedByKeyId");