import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  integer,
  text,
} from "drizzle-orm/pg-core";
import { z } from "zod";

export const UsersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom().unique(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  password: varchar("password", { length: 255 }).notNull(),
  dateCreated: timestamp("dateCreated").notNull().defaultNow(),
  isActive: boolean("isActive").notNull().default(true),
  lastLogin: timestamp("lastLogin").notNull().defaultNow(),
  isAdmin: boolean("isAdmin").notNull().default(false),
  lastIp: varchar("lastIp", { length: 255 }).notNull().default(""),
  isPremium: boolean("isPremium").notNull().default(false),
  premiumEndsAt: timestamp("premiumEndsAt").notNull().defaultNow(),
  isWebAdmin: boolean("isWebAdmin").notNull().default(false),
  notes: text("notes").notNull().default(""),
  roleId: integer("roleId")
    .notNull()
    .default(0)
    .references(() => RoleTable.id),
});

export const RoleTable = pgTable("role", {
  id: integer("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  permissionsId: integer("permissionsId").notNull().default(100),
});

// export const PaymentSchema = pgTable("payment", {
//   id: uuid("id").primaryKey().defaultRandom().unique(),
//   userId: uuid("userId")
//     .notNull()
//     .references(() => UsersTable.id),
//   paymentId: varchar("paymentId", { length: 255 }).notNull().default(""),
//   paymentStatus: varchar("paymentStatus", { length: 255 })
//     .notNull()
//     .default(""),
//   paymentDate: timestamp("paymentDate").notNull().defaultNow(),
//   paymentAmount: integer("paymentAmount").notNull().default(0),
//   paymentCurrency: varchar("paymentCurrency", { length: 255 })
//     .notNull()
//     .default("EUR"),
//   confirmed: boolean("confirmed").notNull().default(false),
// });

export const UserLoginSchema = z.object({
  username: z.string().min(3).max(255),
  password: z.string().min(3).max(255),
});

export const UserRegisterSchema = z
  .object({
    username: z.string().min(3).max(255),
    email: z.string().email({
      message: "Please provide a valid email address",
    }),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(255)
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])[\S]{8,}$/,
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
      ),
    repeatPassword: z.string(),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords must match",
    path: ["repeatPassword"],
  });

export const AuthorizationSchema = z.object({
  authorization: z
    .string()
    .min(10)
    .startsWith("eyJh", { message: "Invalid authorization" }),
});

export const RoleSchema = z.object({
  roleId: z.number().min(100).max(102),
});
