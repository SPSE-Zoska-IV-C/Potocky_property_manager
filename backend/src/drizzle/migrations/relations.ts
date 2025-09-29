import { relations } from "drizzle-orm/relations";
import { property, propertyPermissions, users } from "./schema";

export const propertyPermissionsRelations = relations(propertyPermissions, ({one}) => ({
	property: one(property, {
		fields: [propertyPermissions.propertyId],
		references: [property.propertyId]
	}),
	user: one(users, {
		fields: [propertyPermissions.userId],
		references: [users.id]
	}),
}));

export const propertyRelations = relations(property, ({one, many}) => ({
	propertyPermissions: many(propertyPermissions),
	user: one(users, {
		fields: [property.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	propertyPermissions: many(propertyPermissions),
	properties: many(property),
}));