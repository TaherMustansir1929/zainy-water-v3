import { and, desc, eq, gte, lte } from "drizzle-orm";
import { endOfDay, startOfDay } from "date-fns";
import { createServerFn } from "@tanstack/react-start";

import { db } from "@/db";
import { Customer, Delivery } from "@/db/schema";
import { requireModeratorAuthMiddleware } from "@/routes/moderator/login/-server/modMiddleware.function";
import {
	customerDeliverySchema,
	getCustomersByAreaInputSchema,
	getDailyDeliveriesInputSchema,
} from "@/types/moderator.types";

export const getDailyDelivery = createServerFn({ method: "GET" })
	.middleware([requireModeratorAuthMiddleware])
	.inputValidator(getDailyDeliveriesInputSchema)
	.handler(async ({ data, context }) => {
		const deliveries = await db
			.select()
			.from(Delivery)
			.where(
				and(
					eq(Delivery.moderator_id, context.moderator.id),
					gte(Delivery.delivery_date, startOfDay(data.date)),
					lte(Delivery.delivery_date, endOfDay(data.date)),
				),
			)
			.orderBy(desc(Delivery.createdAt))
			.innerJoin(Customer, eq(Delivery.customer_id, Customer.customer_id));

		return deliveries.map(({ Delivery: joinedDelivery, Customer: joinedCustomer }) => ({
			delivery: joinedDelivery,
			customer: customerDeliverySchema.parse(joinedCustomer),
		}));
	});

export const getCustomersByArea = createServerFn({ method: "GET" })
	.middleware([requireModeratorAuthMiddleware])
	.inputValidator(getCustomersByAreaInputSchema)
	.handler(async ({ data, context }) => {
		if (!context.moderator.areas.includes(data.area)) {
			return [];
		}

		const customers = await db
			.select()
			.from(Customer)
			.where(and(eq(Customer.area, data.area), eq(Customer.isActive, true)))
			.orderBy(Customer.name);

		return customers.map((customer) => customerDeliverySchema.parse(customer));
	});