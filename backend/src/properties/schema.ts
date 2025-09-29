import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  integer,
  unique,
  date,
  text,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { UsersTable } from "../users/schema";

import { z } from "zod";

export const PropertyTable = pgTable("property", {
  propertyId: uuid("propertyId").primaryKey().defaultRandom().unique(),
  groupId: uuid("groupId")
    .references(() => GroupsTable.id)
    .notNull(),
  createdBy: uuid("createdBy")
    .references(() => UsersTable.id)
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: varchar("address", { length: 255 }).notNull(),
  isRented: boolean("isRented").notNull().default(false),
  pricePerDay: integer("pricePerDay").notNull(),
  dateCreated: timestamp("dateCreated").notNull().defaultNow(),
  lastDateRented: timestamp("lastDateRented").notNull().defaultNow(),
  lastDayCleaned: timestamp("lastDayCleaned").notNull().defaultNow(),
  size: integer("size").notNull().default(0),
  rooms: integer("rooms").notNull().default(1),
  loan: integer("loan").notNull().default(0),
  propertySellPriceNow: integer("propertySellPriceNow").notNull().default(0),
  propertyBuyPrice: integer("propertyBuyPrice").notNull().default(0),
});

export const GuestsTable = pgTable("guests", {
  guestId: uuid("guestId").primaryKey().defaultRandom(),
  groupId: uuid("groupId")
    .references(() => GroupsTable.id)
    .notNull(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  nationality: varchar("nationality", { length: 100 }),
  dateOfBirth: date("dateOfBirth"),
  idNumber: varchar("idNumber", { length: 100 }),
  idType: varchar("idType", { length: 50 }), // passport, national ID, etc.
  notes: text("notes"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  createdBy: uuid("createdBy")
    .references(() => UsersTable.id)
    .notNull(),
});

export const StaysTable = pgTable("stays", {
  stayId: uuid("stayId").primaryKey().defaultRandom(),
  propertyId: uuid("propertyId")
    .references(() => PropertyTable.propertyId)
    .notNull(),
  guestId: uuid("guestId")
    .references(() => GuestsTable.guestId)
    .notNull(),
  checkIn: date("checkIn").notNull(),
  checkOut: date("checkOut").notNull(),
  totalPrice: integer("totalPrice").notNull(),
  status: varchar("status", { length: 50 }).notNull().default("upcoming"),
  paymentStatus: varchar("paymentStatus", { length: 50 })
    .notNull()
    .default("pending"),
  numberOfGuests: integer("numberOfGuests").notNull().default(1),
  specialRequests: text("specialRequests"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  createdBy: uuid("createdBy")
    .references(() => UsersTable.id)
    .notNull(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const GroupsTable = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  ownerId: uuid("ownerId")
    .references(() => UsersTable.id)
    .notNull(),
  dateCreated: timestamp("dateCreated").notNull().defaultNow(),
});

export const GroupMembersTable = pgTable("group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("groupId")
    .references(() => GroupsTable.id)
    .notNull(),
  userId: uuid("userId")
    .references(() => UsersTable.id)
    .notNull(),
  dateJoined: timestamp("dateJoined").notNull().defaultNow(),
});

export const GroupPropertyPermissionsTable = pgTable(
  "group_property_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    propertyId: uuid("propertyId")
      .references(() => PropertyTable.propertyId)
      .notNull(),
    groupId: uuid("groupId")
      .references(() => GroupsTable.id)
      .notNull(),
    dateCreated: timestamp("dateCreated").notNull().defaultNow(),
  }
);

// this table manages permissions for properties within groups,
// ensuring that only authorized group members can access or modify properties

export const PropertyPermissionsTable = pgTable("property_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("propertyId")
    .references(() => PropertyTable.propertyId)
    .notNull(),
  userId: uuid("userId")
    .references(() => UsersTable.id)
    .notNull(),
  dateCreated: timestamp("dateCreated").notNull().defaultNow(),
});

export const GroupMemberRolesTable = pgTable(
  "group_member_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    groupId: uuid("groupId")
      .references(() => GroupsTable.id)
      .notNull(),
    userId: uuid("userId")
      .references(() => UsersTable.id)
      .notNull(),
    role: varchar("role", { length: 50 }).notNull().default("member"),
    dateAssigned: timestamp("dateAssigned").notNull().defaultNow(),
  },
  (table) => {
    return {
      groupUserUnique: unique().on(table.groupId, table.userId),
    };
  }
);

export const CleaningNotificationsTable = pgTable("cleaning_notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  propertyId: uuid("property_id")
    .references(() => PropertyTable.propertyId)
    .notNull(),
  assignedTo: uuid("assigned_to")
    .references(() => UsersTable.id)
    .notNull(),
  stayId: uuid("stay_id").references(() => StaysTable.stayId),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  scheduledDate: date("scheduled_date").notNull(),
  completedDate: timestamp("completed_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: uuid("created_by")
    .references(() => UsersTable.id)
    .notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const cleaningNotificationsRelations = relations(
  CleaningNotificationsTable,
  ({ one }) => ({
    property: one(PropertyTable, {
      fields: [CleaningNotificationsTable.propertyId],
      references: [PropertyTable.propertyId],
    }),
    assignedUser: one(UsersTable, {
      fields: [CleaningNotificationsTable.assignedTo],
      references: [UsersTable.id],
    }),
    creator: one(UsersTable, {
      fields: [CleaningNotificationsTable.createdBy],
      references: [UsersTable.id],
    }),
    stay: one(StaysTable, {
      fields: [CleaningNotificationsTable.stayId],
      references: [StaysTable.stayId],
    }),
  })
);

export const CleaningNotificationSchema = z.object({
  propertyId: z.string().uuid(),
  assignedTo: z.string().uuid(),
  stayId: z.string().uuid().optional(),
  scheduledDate: z.string(),
  notes: z.string().optional(),
  status: z
    .enum(["pending", "in_progress", "completed", "cancelled"])
    .optional(),
});

export const PropertySchema = z.object({
  name: z.string().min(3).max(255),
  address: z.string().min(3).max(255),
  pricePerDay: z.number().min(1),
  isRented: z.boolean().default(false).optional(),
  lastDateRented: z
    .preprocess(
      (val) => (typeof val === "string" ? new Date(val) : val),
      z.date()
    )
    .optional(),
  lastDayCleaned: z
    .preprocess(
      (val) => (typeof val === "string" ? new Date(val) : val),
      z.date()
    )
    .optional(),
  size: z.number().min(20).optional(),
  rooms: z.number().min(1).max(10).optional(),
  loan: z.number().min(0).optional(),
  propertySellPriceNow: z.number().min(0).optional(),
  propertyBuyPrice: z.number().min(0).optional(),
});

export const GroupSchema = z.object({
  name: z.string().min(3).max(255),
});

export const GroupMemberSchema = z.object({
  username: z.string().min(3).max(255),
});

export const GroupMemberRoleSchema = z.object({
  role: z.enum(["member", "admin", "cleaner"]),
});

export const GuestSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(5).max(50).optional().nullable(),
  nationality: z.string().max(100).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  idNumber: z.string().max(100).optional().nullable(),
  idType: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const StaySchema = z.object({
  propertyId: z.string().uuid(),
  guestId: z.string().uuid(),
  checkInDate: z.string(),
  checkOutDate: z.string(),
  totalPrice: z.number().min(0),
  numberOfGuests: z.number().min(1),
  specialRequests: z.string().nullable().optional(),
  status: z.enum(["upcoming", "active", "completed", "cancelled"]).optional(),
  paymentStatus: z.enum(["pending", "partial", "paid"]).optional(),
});

// Listing schema for property listings
export const listingSchema = {
  id: { type: "string", primary: true },
  title: { type: "string", required: true },
  description: { type: "string", required: true },
  price: { type: "number", required: true },
  address: { type: "string", required: true },
  images: { type: "array", items: { type: "string" }, default: [] },
  propertyType: { type: "string", required: true },
  features: { type: "array", items: { type: "string" }, default: [] },
  status: {
    type: "string",
    enum: ["active", "inactive", "sold"],
    default: "active",
  },
  ownerId: { type: "string", required: true },
  createdAt: { type: "date", default: () => new Date() },
  updatedAt: { type: "date", default: () => new Date() },
};
