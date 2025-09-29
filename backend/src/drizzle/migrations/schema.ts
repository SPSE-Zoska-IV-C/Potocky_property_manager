import { pgTable, unique, uuid, varchar, timestamp, boolean, foreignKey, integer } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"




export const users = pgTable("users", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	username: varchar("username", { length: 255 }).notNull(),
	password: varchar("password", { length: 255 }).notNull(),
	dateCreated: timestamp("dateCreated", { mode: 'string' }).defaultNow().notNull(),
	isActive: boolean("isActive").default(true).notNull(),
	lastLogin: timestamp("lastLogin", { mode: 'string' }).defaultNow().notNull(),
	isAdmin: boolean("isAdmin").default(false).notNull(),
	lastIp: varchar("lastIp", { length: 255 }).default('').notNull(),
},
(table) => {
	return {
		usersUsernameUnique: unique("users_username_unique").on(table.username),
	}
});

export const propertyPermissions = pgTable("property_permissions", {
	id: uuid("id").defaultRandom().primaryKey().notNull(),
	propertyId: uuid("propertyId").notNull(),
	userId: uuid("userId").notNull(),
	dateCreated: timestamp("dateCreated", { mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		propertyPermissionsPropertyIdPropertyPropertyIdFk: foreignKey({
			columns: [table.propertyId],
			foreignColumns: [property.propertyId],
			name: "property_permissions_propertyId_property_propertyId_fk"
		}),
		propertyPermissionsUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "property_permissions_userId_users_id_fk"
		}),
	}
});

export const property = pgTable("property", {
	propertyId: uuid("propertyId").defaultRandom().primaryKey().notNull(),
	userId: uuid("userId").notNull(),
	name: varchar("name", { length: 255 }).notNull(),
	address: varchar("address", { length: 255 }).notNull(),
	isRented: boolean("isRented").default(false).notNull(),
	pricePerDay: integer("pricePerDay").notNull(),
	dateCreated: timestamp("dateCreated", { mode: 'string' }).defaultNow().notNull(),
	lastDateRented: timestamp("lastDateRented", { mode: 'string' }).defaultNow().notNull(),
	lastDayCleaned: timestamp("lastDayCleaned", { mode: 'string' }).defaultNow().notNull(),
	size: integer("size").default(0).notNull(),
	rooms: integer("rooms").default(1).notNull(),
	loan: integer("loan").default(0).notNull(),
	propertySellPriceNow: integer("propertySellPriceNow").default(0).notNull(),
	propertyBuyPrice: integer("propertyBuyPrice").default(0).notNull(),
},
(table) => {
	return {
		propertyUserIdUsersIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "property_userId_users_id_fk"
		}),
	}
});