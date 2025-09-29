import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../../drizzle/db";
import {
  GroupMembersTable,
  GroupsTable,
  GroupMemberRolesTable,
} from "../../properties/schema";
import { UsersTable, RoleTable } from "../../users/schema";
import { handleError } from "../../shared/http";

// get all users with their roles
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await db
      .select({
        id: UsersTable.id,
        username: UsersTable.username,
        dateCreated: UsersTable.dateCreated,
        isActive: UsersTable.isActive,
        lastLogin: UsersTable.lastLogin,
        isAdmin: UsersTable.isAdmin,
        lastIp: UsersTable.lastIp,
        isPremium: UsersTable.isPremium,
        premiumEndsAt: UsersTable.premiumEndsAt,
        isWebAdmin: UsersTable.isWebAdmin,
        notes: UsersTable.notes,
        roleName: RoleTable.name,
        roleId: RoleTable.id,
        permissionsId: RoleTable.permissionsId,
      })
      .from(UsersTable)
      .leftJoin(RoleTable, eq(UsersTable.roleId, RoleTable.id));

    return res.status(200).json({
      success: true,
      users,
      message: "Users retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// get user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await db
      .select({
        id: UsersTable.id,
        username: UsersTable.username,
        dateCreated: UsersTable.dateCreated,
        isActive: UsersTable.isActive,
        lastLogin: UsersTable.lastLogin,
        isAdmin: UsersTable.isAdmin,
        lastIp: UsersTable.lastIp,
        isPremium: UsersTable.isPremium,
        premiumEndsAt: UsersTable.premiumEndsAt,
        isWebAdmin: UsersTable.isWebAdmin,
        notes: UsersTable.notes,
        roleName: RoleTable.name,
        roleId: RoleTable.id,
        permissionsId: RoleTable.permissionsId,
      })
      .from(UsersTable)
      .leftJoin(RoleTable, eq(UsersTable.roleId, RoleTable.id))
      .where(eq(UsersTable.id, id));

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user: user[0],
      message: "User retrieved successfully",
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// update user
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = res.locals.userId;
    const updates = { ...req.body };

    // prevent web admin from deactivating themselves
    if (id === currentUserId && updates.isActive === false) {
      return res.status(403).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    // prevent web admin from removing their own web admin status
    if (id === currentUserId && updates.isWebAdmin === false) {
      return res.status(403).json({
        success: false,
        message: "You cannot remove your own web admin status",
      });
    }

    // remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates.id;

    // handle date fields
    if (updates.premiumEndsAt === null || updates.premiumEndsAt === "") {
      updates.premiumEndsAt = new Date();
    } else if (typeof updates.premiumEndsAt === "string") {
      updates.premiumEndsAt = new Date(updates.premiumEndsAt);
    }

    // validate date
    if (
      updates.premiumEndsAt &&
      !(
        updates.premiumEndsAt instanceof Date &&
        !isNaN(updates.premiumEndsAt.getTime())
      )
    ) {
      return handleError(
        res,
        "Invalid premium expiration date",
        400,
        "Invalid premium expiration date"
      );
    }

    await db.update(UsersTable).set(updates).where(eq(UsersTable.id, id));

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// delete user
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = res.locals.userId;

    // prevent web admin from deleting themselves
    if (id === currentUserId) {
      return res.status(403).json({
        success: false,
        message: "You cannot delete your own account",
      });
    }

    // start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // 1. Delete all group member roles
      await tx
        .delete(GroupMemberRolesTable)
        .where(eq(GroupMemberRolesTable.userId, id));

      // 2. Delete all group memberships
      await tx
        .delete(GroupMembersTable)
        .where(eq(GroupMembersTable.userId, id));

      // 3. Find groups where user is owner
      const ownedGroups = await tx
        .select({ id: GroupsTable.id })
        .from(GroupsTable)
        .where(eq(GroupsTable.ownerId, id));

      // 4. Delete owned groups (this will cascade delete group memberships and roles)
      for (const group of ownedGroups) {
        await tx.delete(GroupsTable).where(eq(GroupsTable.id, group.id));
      }

      // 5. Finally delete the user
      await tx.delete(UsersTable).where(eq(UsersTable.id, id));
    });

    return res.status(200).json({
      success: true,
      message: "User and all associated data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
