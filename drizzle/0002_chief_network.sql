ALTER TABLE "DeveloperAccessKey" ADD COLUMN "plainKey" text NOT NULL;--> statement-breakpoint
ALTER TABLE "DeveloperAccessKey" ADD CONSTRAINT "DeveloperAccessKey_plainKey_unique" UNIQUE("plainKey");