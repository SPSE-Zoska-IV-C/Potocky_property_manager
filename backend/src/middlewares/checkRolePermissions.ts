import { Request, Response, NextFunction } from "express";
import { db } from "../drizzle/db";
import { eq, and } from "drizzle-orm";
import { GroupMemberRolesTable, GroupsTable } from "../properties/schema";
import { handleError } from "../shared/http";

// get user's role in a group
const getUserRole = async (groupId: string, userId: string) => {
  const group = await db.query.groupsTable.findFirst({
    where: eq(GroupsTable.id, groupId),
  });

  // if user is the owner, return "owner" role
  if (group?.ownerId === userId) {
    return "owner";
  }

  const roleRecord = await db.query.groupMemberRolesTable.findFirst({
    where: and(
      eq(GroupMemberRolesTable.groupId, groupId),
      eq(GroupMemberRolesTable.userId, userId)
    ),
  });

  return roleRecord?.role || "member";
};

//  check if user has required role for the action
export const checkRolePermissions = (allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = res.locals.userId;
      const { groupId } = req.params;

      if (!groupId) {
        return handleError(
          res,
          "Group ID is required",
          400,
          "Group ID is required"
        );
      }

      const userRole = await getUserRole(groupId, userId);

      if (!allowedRoles.includes(userRole)) {
        return handleError(
          res,
          "You don't have permission to perform this action",
          403,
          "You don't have permission to perform this action"
        );
      }

      // Add the user's role to res.locals for potential use in route handlers
      res.locals.userRole = userRole;
      next();
    } catch (error) {
      console.error("Error checking role permissions:", error);
      return handleError(
        res,
        "Failed to verify permissions",
        500,
        "Failed to verify permissions"
      );
    }
  };
};
