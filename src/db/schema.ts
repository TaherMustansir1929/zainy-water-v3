import cuid from "cuid";
import { relations } from "drizzle-orm";
import {
  boolean,
  foreignKey,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { areas_list } from "./areas";

// Enum for Area
export const Area = pgEnum("Area", areas_list);

// Admin table
export const Admin = pgTable(
  "Admin",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    name: text("name").notNull(),
    clerk_id: varchar("clerk_id", { length: 255 }).notNull().unique(),
    isAuthorized: boolean("isAuthorized").notNull().default(false),
    authorizedByKeyId: varchar("authorizedByKeyId"),
    authorizedAt: timestamp("authorizedAt", { withTimezone: true }),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("admin_id_idx").on(table.id),
    index("admin_clerk_id_idx").on(table.clerk_id),
    index("admin_authorized_by_key_id_idx").on(table.authorizedByKeyId),
  ]
);

// Developer access key table
export const DeveloperAccessKey = pgTable(
  "DeveloperAccessKey",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    label: varchar("label", { length: 255 }),
    developerKey: text("plainKey").notNull().unique(),
    expirationDate: timestamp("expiresAt", { withTimezone: true }).notNull(),
    usedAt: timestamp("usedAt", { withTimezone: true }),
    usedByClerkId: varchar("usedByClerkId", { length: 255 }),
    usedByAdminId: varchar("usedByAdminId"),
    isActive: boolean("isActive").notNull().default(true),
    revokedAt: timestamp("revokedAt", { withTimezone: true }),
    revokedReason: text("revokedReason"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("developer_access_key_id_idx").on(table.id),
    index("developer_access_key_expires_at_idx").on(table.expirationDate),
    index("developer_access_key_is_active_idx").on(table.isActive),
    foreignKey({
      columns: [table.usedByAdminId],
      foreignColumns: [Admin.id],
      name: "developer_access_key_used_by_admin_fk",
    }).onDelete("set null"),
  ]
);

// Customer table
export const Customer = pgTable(
  "Customer",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    customer_id: varchar("customer_id", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    address: text("address").notNull(),
    area: Area("area").notNull(),
    phone: varchar("phone", { length: 50 }).notNull(),
    bottle_price: integer("bottle_price").notNull(),
    bottles: integer("bottles").notNull(),
    deposit: integer("deposit").notNull(),
    deposit_price: integer("deposit_price").notNull().default(1000),
    balance: integer("balance").notNull(),
    isActive: boolean("isActive").notNull().default(true),
    customerSince: timestamp("customerSince", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("customer_id_idx").on(table.id),
    index("customer_customer_id_idx").on(table.customer_id),
  ]
);

// Moderator table
export const Moderator = pgTable(
  "Moderator",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    name: varchar("name", { length: 255 }).notNull().unique(),
    password: varchar("password", { length: 255 }).notNull(),
    areas: Area("areas").array().notNull(),
    isWorking: boolean("isWorking").notNull().default(true),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("moderator_id_idx").on(table.id)]
);

// Delivery table
export const Delivery = pgTable(
  "Delivery",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    customer_id: varchar("customer_id", { length: 255 }).notNull(),
    moderator_id: varchar("moderator_id", { length: 255 }).notNull(),
    delivery_date: timestamp("delivery_date", { withTimezone: true }).notNull(),
    payment: integer("payment").notNull(),
    filled_bottles: integer("filled_bottles").notNull(),
    empty_bottles: integer("empty_bottles").notNull(),
    foc: integer("foc").notNull(),
    damaged_bottles: integer("damaged_bottles").notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("delivery_id_idx").on(table.id),
    index("delivery_customer_id_idx").on(table.customer_id),
    index("delivery_moderator_id_idx").on(table.moderator_id),
    foreignKey({
      columns: [table.customer_id],
      foreignColumns: [Customer.customer_id],
      name: "delivery_customer_fk",
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.moderator_id],
      foreignColumns: [Moderator.id],
      name: "delivery_moderator_fk",
    }).onDelete("cascade"),
  ]
);

// OtherExpense table
export const OtherExpense = pgTable(
  "OtherExpense",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    moderator_id: varchar("moderator_id", { length: 255 }).notNull(),
    amount: integer("amount").notNull(),
    description: text("description").notNull(),
    refilled_bottles: integer("refilled_bottles").notNull().default(0),
    date: timestamp("date", { withTimezone: true }).notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    idIdx: index("other_expense_id_idx").on(table.id),
    moderatorIdIdx: index("other_expense_moderator_id_idx").on(
      table.moderator_id
    ),
    moderatorFk: foreignKey({
      columns: [table.moderator_id],
      foreignColumns: [Moderator.id],
      name: "other_expense_moderator_fk",
    }).onDelete("cascade"),
  })
);

// Miscellaneous table
export const Miscellaneous = pgTable(
  "Miscellaneous",
  {
    id: varchar("id")
      .primaryKey()
      .$defaultFn(() => cuid()),
    moderator_id: varchar("moderator_id", { length: 255 }).notNull(),
    customer_name: varchar("customer_name", { length: 255 }).notNull(),
    description: text("description").notNull(),
    isPaid: boolean("isPaid").notNull(),
    payment: integer("payment").notNull(),
    filled_bottles: integer("filled_bottles").notNull(),
    empty_bottles: integer("empty_bottles").notNull(),
    damaged_bottles: integer("damaged_bottles").notNull(),
    delivery_date: timestamp("delivery_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    moderatorIdIdx: index("misc_moderator_id_idx").on(table.moderator_id),
    isPaidIdx: index("misc_is_paid_idx").on(table.isPaid),
    moderatorFk: foreignKey({
      columns: [table.moderator_id],
      foreignColumns: [Moderator.id],
      name: "miscellaneous_moderator_fk",
    }).onDelete("cascade"),
  })
);

// TotalBottles table
export const TotalBottles = pgTable("TotalBottles", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  total_bottles: integer("total_bottles").notNull(),
  available_bottles: integer("available_bottles").notNull(),
  used_bottles: integer("used_bottles").notNull().default(0),
  damaged_bottles: integer("damaged_bottles").notNull().default(0),
  deposit_bottles: integer("deposit_bottles").notNull().default(0),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// BottleUsage table
export const BottleUsage = pgTable("BottleUsage", {
  id: varchar("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  moderator_id: varchar("moderator_id", { length: 255 }).notNull(),
  filled_bottles: integer("filled_bottles").notNull(),
  sales: integer("sales").notNull().default(0),
  empty_bottles: integer("empty_bottles").notNull().default(0),
  remaining_bottles: integer("remaining_bottles").notNull().default(0),
  returned_bottles: integer("returned_bottles").notNull().default(0),
  empty_returned: integer("empty_returned").notNull().default(0),
  remaining_returned: integer("remaining_returned").notNull().default(0),
  damaged_bottles: integer("damaged_bottles").notNull().default(0),
  refilled_bottles: integer("refilled_bottles").notNull().default(0),
  revenue: integer("revenue").notNull().default(0),
  expense: integer("expense").notNull().default(0),
  caps: integer("caps").notNull().default(0),
  done: boolean("done").notNull().default(false),
  createdAt: timestamp("createdAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Relations
export const customerRelations = relations(Customer, ({ many }) => ({
  deliveries: many(Delivery),
}));

export const moderatorRelations = relations(Moderator, ({ many }) => ({
  deliveries: many(Delivery),
  otherExpenses: many(OtherExpense),
  bottleUsages: many(BottleUsage),
  miscellaneous: many(Miscellaneous),
}));

export const deliveryRelations = relations(Delivery, ({ one }) => ({
  moderator: one(Moderator, {
    fields: [Delivery.moderator_id],
    references: [Moderator.id],
  }),
  customer: one(Customer, {
    fields: [Delivery.customer_id],
    references: [Customer.customer_id],
  }),
}));

export const otherExpenseRelations = relations(OtherExpense, ({ one }) => ({
  moderator: one(Moderator, {
    fields: [OtherExpense.moderator_id],
    references: [Moderator.id],
  }),
}));

export const bottleUsageRelations = relations(BottleUsage, ({ one }) => ({
  moderator: one(Moderator, {
    fields: [BottleUsage.moderator_id],
    references: [Moderator.id],
  }),
}));

export const miscellaneousRelations = relations(Miscellaneous, ({ one }) => ({
  moderator: one(Moderator, {
    fields: [Miscellaneous.moderator_id],
    references: [Moderator.id],
  }),
}));

export const adminRelations = relations(Admin, ({ many }) => ({
  consumedDeveloperKeys: many(DeveloperAccessKey),
}));

export const developerAccessKeyRelations = relations(
  DeveloperAccessKey,
  ({ one }) => ({
    usedByAdmin: one(Admin, {
      fields: [DeveloperAccessKey.usedByAdminId],
      references: [Admin.id],
    }),
  })
);
