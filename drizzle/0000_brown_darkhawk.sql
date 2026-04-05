CREATE TYPE "public"."Area" AS ENUM('Aisha Manzil', 'Arambagh', 'Askari (I–XIV)', 'Bahadurabad', 'Bahria Town Karachi', 'Baldia Town', 'Banaras Colony', 'Bolton Market', 'Buffer Zone', 'Burns Road', 'Chakiwara', 'Civic Centre', 'Clifton', 'DHA City', 'DHA', 'Drigh Colony', 'Essa Nagri', 'Essa Mohalla', 'FB Area (Blocks 1–22)', 'Garden East', 'Garden West', 'Ghari Khata', 'Golimar', 'Gulberg', 'Gulistan-e-Johar', 'Gulshan-e-Iqbal', 'Hyderi Market', 'I.I. Chundrigar Road', 'Jamshed Town', 'Jodia Bazaar', 'Kagzi Bazaar', 'Karimabad', 'KDA', 'Keamari', 'Kharadar', 'Korangi', 'Liaquatabad', 'Light House', 'M.A. Jinnah Road', 'Mithadar', 'Model Colony', 'Nanakwara', 'Nazimabad (Nos. 1–7)', 'New Karachi', 'North Karachi', 'North Nazimabad Block A', 'North Nazimabad Block B', 'North Nazimabad Block C', 'North Nazimabad Block D', 'North Nazimabad Block E', 'North Nazimabad Block F', 'North Nazimabad Block G', 'North Nazimabad Block H', 'North Nazimabad Block I', 'North Nazimabad Block J', 'North Nazimabad Block K', 'North Nazimabad Block L', 'North Nazimabad Block M', 'North Nazimabad Block N', 'North Nazimabad Block O', 'North Nazimabad Block P', 'North Nazimabad Block Q', 'North Nazimabad Block R', 'North Nazimabad Block S', 'North Nazimabad Block T', 'North Nazimabad Block U', 'North Nazimabad Block V', 'North Nazimabad Block W', 'North Nazimabad Block X', 'North Nazimabad Block Y', 'North Nazimabad Block Z', 'Pan Mandi', 'Pakistan Chowk', 'Paposh Nagar', 'Ranchore Line', 'Saify Nagar', 'Saddar', 'Shabbirabad', 'Shah Faisal Colony', 'Shadman Town', 'SITE Area', 'Soldier Bazaar', 'Surjani Town', 'Tariq Road', 'Teen Hatti', 'Timber Market', 'Water Pump', 'Landa Bazar');--> statement-breakpoint
CREATE TABLE "Admin" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"isAuthorized" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Admin_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
CREATE TABLE "BottleUsage" (
	"id" varchar PRIMARY KEY NOT NULL,
	"moderator_id" varchar(255) NOT NULL,
	"filled_bottles" integer NOT NULL,
	"sales" integer DEFAULT 0 NOT NULL,
	"empty_bottles" integer DEFAULT 0 NOT NULL,
	"remaining_bottles" integer DEFAULT 0 NOT NULL,
	"returned_bottles" integer DEFAULT 0 NOT NULL,
	"empty_returned" integer DEFAULT 0 NOT NULL,
	"remaining_returned" integer DEFAULT 0 NOT NULL,
	"damaged_bottles" integer DEFAULT 0 NOT NULL,
	"refilled_bottles" integer DEFAULT 0 NOT NULL,
	"revenue" integer DEFAULT 0 NOT NULL,
	"expense" integer DEFAULT 0 NOT NULL,
	"caps" integer DEFAULT 0 NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Customer" (
	"id" varchar PRIMARY KEY NOT NULL,
	"customer_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text NOT NULL,
	"area" "Area" NOT NULL,
	"phone" varchar(50) NOT NULL,
	"bottle_price" integer NOT NULL,
	"bottles" integer NOT NULL,
	"deposit" integer NOT NULL,
	"deposit_price" integer DEFAULT 1000 NOT NULL,
	"balance" integer NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"customerSince" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Customer_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "Delivery" (
	"id" varchar PRIMARY KEY NOT NULL,
	"customer_id" varchar(255) NOT NULL,
	"moderator_id" varchar(255) NOT NULL,
	"delivery_date" timestamp with time zone NOT NULL,
	"payment" integer NOT NULL,
	"filled_bottles" integer NOT NULL,
	"empty_bottles" integer NOT NULL,
	"foc" integer NOT NULL,
	"damaged_bottles" integer NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Miscellaneous" (
	"id" varchar PRIMARY KEY NOT NULL,
	"moderator_id" varchar(255) NOT NULL,
	"customer_name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"isPaid" boolean NOT NULL,
	"payment" integer NOT NULL,
	"filled_bottles" integer NOT NULL,
	"empty_bottles" integer NOT NULL,
	"damaged_bottles" integer NOT NULL,
	"delivery_date" timestamp with time zone DEFAULT now() NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Moderator" (
	"id" varchar PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"password" varchar(255) NOT NULL,
	"areas" "Area"[] NOT NULL,
	"isWorking" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "Moderator_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "OtherExpense" (
	"id" varchar PRIMARY KEY NOT NULL,
	"moderator_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"refilled_bottles" integer DEFAULT 0 NOT NULL,
	"date" timestamp with time zone NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "TotalBottles" (
	"id" varchar PRIMARY KEY NOT NULL,
	"total_bottles" integer NOT NULL,
	"available_bottles" integer NOT NULL,
	"used_bottles" integer DEFAULT 0 NOT NULL,
	"damaged_bottles" integer DEFAULT 0 NOT NULL,
	"deposit_bottles" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp with time zone DEFAULT now() NOT NULL,
	"updatedAt" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Delivery" ADD CONSTRAINT "delivery_customer_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."Customer"("customer_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Delivery" ADD CONSTRAINT "delivery_moderator_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."Moderator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Miscellaneous" ADD CONSTRAINT "miscellaneous_moderator_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."Moderator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "OtherExpense" ADD CONSTRAINT "other_expense_moderator_fk" FOREIGN KEY ("moderator_id") REFERENCES "public"."Moderator"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_id_idx" ON "Admin" USING btree ("id");--> statement-breakpoint
CREATE INDEX "admin_clerk_id_idx" ON "Admin" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "customer_id_idx" ON "Customer" USING btree ("id");--> statement-breakpoint
CREATE INDEX "customer_customer_id_idx" ON "Customer" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "delivery_id_idx" ON "Delivery" USING btree ("id");--> statement-breakpoint
CREATE INDEX "delivery_customer_id_idx" ON "Delivery" USING btree ("customer_id");--> statement-breakpoint
CREATE INDEX "delivery_moderator_id_idx" ON "Delivery" USING btree ("moderator_id");--> statement-breakpoint
CREATE INDEX "misc_moderator_id_idx" ON "Miscellaneous" USING btree ("moderator_id");--> statement-breakpoint
CREATE INDEX "misc_is_paid_idx" ON "Miscellaneous" USING btree ("isPaid");--> statement-breakpoint
CREATE INDEX "moderator_id_idx" ON "Moderator" USING btree ("id");--> statement-breakpoint
CREATE INDEX "other_expense_id_idx" ON "OtherExpense" USING btree ("id");--> statement-breakpoint
CREATE INDEX "other_expense_moderator_id_idx" ON "OtherExpense" USING btree ("moderator_id");