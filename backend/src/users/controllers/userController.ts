import { NextFunction, Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq } from "drizzle-orm";
import { UsersTable, RoleTable } from "../schema";
import { handleError } from "../../shared/http";

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const users = await db.query.usersTable.findMany();
    res.json(users);
  } catch (error) {
    next(error);
  }
};

export const getCurrentUser = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let user = await db.query.usersTable.findFirst({
      where: eq(UsersTable.id, res.locals.userId),
      columns: {
        id: true,
        username: true,
        isAdmin: true,
        isActive: true,
        roleId: true,
        isPremium: true,
        premiumEndsAt: true,
        email: true,
      },
    });

    // auto-demote premium if expired
    if (
      user &&
      user.isPremium &&
      user.premiumEndsAt &&
      new Date(user.premiumEndsAt) < new Date()
    ) {
      await db
        .update(UsersTable)
        .set({ isPremium: false, premiumEndsAt: undefined })
        .where(eq(UsersTable.id, user.id));
      user.isPremium = false;
      user.premiumEndsAt = new Date("00-00-0000");
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ data: user, message: "Success" });
  } catch (error) {
    next(error);
  }
};

export const makeUserAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    const user = await db
      .update(UsersTable)
      .set({ isAdmin: true })
      .where(eq(UsersTable.id, userId));
    res.json({ data: user, message: "Success" });
  } catch (error) {
    next(error);
  }
};

export const setUserPremium = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId } = req.body;
    const user = await db
      .update(UsersTable)
      .set({ isPremium: true })
      .where(eq(UsersTable.id, userId));
    res.json({ data: user, message: "Success" });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id, name, permissionsId } = req.body;
    const role = await db.insert(RoleTable).values({ id, name, permissionsId });
    res.json({ data: role, message: "Success" });
  } catch (error) {
    next(error);
  }
};

export const getAllRoles = async (
  _: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const roles = await db.query.rolesTable.findMany();
    res.json(roles);
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { roleId } = req.body;
  const role = await db.delete(RoleTable).where(eq(RoleTable.id, roleId));
  res.json({ data: role, message: "Success" });
};

export const addRoleToUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { userId, roleId } = req.body;
    const user = await db
      .update(UsersTable)
      .set({ roleId })
      .where(eq(UsersTable.id, userId));
    res.json({ data: user, message: "Success" });
  } catch (error) {
    next(error);
  }
};

export const updateUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { username, email } = req.body;

    // Only allow users to update their own information
    const userId = res.locals.userId;

    // Validate input
    if (!username && !email) {
      return handleError(
        res,
        "No fields to update provided",
        400,
        "No fields to update provided"
      );
    }

    // Create update object with only provided fields
    const updateData: Record<string, any> = {};
    if (username) updateData.username = username;
    if (email) updateData.email = email;

    // Update user
    const updatedUser = await db
      .update(UsersTable)
      .set(updateData)
      .where(eq(UsersTable.id, userId))
      .returning({
        id: UsersTable.id,
        username: UsersTable.username,
        email: UsersTable.email,
        isAdmin: UsersTable.isAdmin,
        isActive: UsersTable.isActive,
        roleId: UsersTable.roleId,
        isPremium: UsersTable.isPremium,
      });

    if (!updatedUser || updatedUser.length === 0) {
      return handleError(res, "User not found", 404, "User not found");
    }

    res.json({
      data: updatedUser[0],
      message: "User information updated successfully",
    });
  } catch (error) {
    next(error);
  }
};
