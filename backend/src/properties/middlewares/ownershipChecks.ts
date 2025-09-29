import { Request, Response, NextFunction } from "express";
import { db } from "../../drizzle/db";
import { eq, and } from "drizzle-orm";
import {
  GroupsTable,
  GroupMembersTable,
  PropertyTable,
  GroupMemberRolesTable,
  StaysTable,
  CleaningNotificationsTable,
} from "../schema";
import { GroupRole, GroupMemberWithRole } from "../types/roles";

// error class for access control
class AccessControlError extends Error {
  status: number;
  constructor(message: string, status: number = 403) {
    super(message);
    this.name = "AccessControlError";
    this.status = status;
  }
}

// error handler middleware
const handleError = (error: any, res: Response) => {
  console.error(`Access control error: ${error.message}`);
  const status = error instanceof AccessControlError ? error.status : 500;
  const message =
    error instanceof AccessControlError
      ? error.message
      : "Internal server error";
  return res.status(status).json({ error: message });
};

const validatePropertyAccess = async (
  propertyId: string,
  userId: string
): Promise<{ groupId: string; isOwner: boolean; isAdmin: boolean }> => {
  const property = await db.query.propertyTable.findFirst({
    where: eq(PropertyTable.propertyId, propertyId),
  });

  if (!property) {
    throw new AccessControlError("Property not found", 404);
  }

  const group = await db.query.groupsTable.findFirst({
    where: eq(GroupsTable.id, property.groupId),
  });

  if (!group) {
    throw new AccessControlError("Group not found", 404);
  }

  const userRole = await db.query.groupMemberRolesTable.findFirst({
    where: and(
      eq(GroupMemberRolesTable.groupId, property.groupId),
      eq(GroupMemberRolesTable.userId, userId)
    ),
  });

  return {
    groupId: property.groupId,
    isOwner: group.ownerId === userId,
    isAdmin: userRole?.role === "admin",
  };
};

export const checkGroupOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId, propertyId } = req.params;
    const userId = res.locals.userId;

    if (!groupId && !propertyId) {
      throw new AccessControlError(
        "Either groupId or propertyId must be provided",
        400
      );
    }

    if (propertyId) {
      const { isOwner, isAdmin } = await validatePropertyAccess(
        propertyId,
        userId
      );

      // For DELETE requests, admins can only delete properties they created
      if (req.method === "DELETE") {
        if (!isOwner && !isAdmin) {
          throw new AccessControlError(
            "Only group owners and admins can delete properties"
          );
        }

        if (isAdmin) {
          const property = await db.query.propertyTable.findFirst({
            where: eq(PropertyTable.propertyId, propertyId),
          });

          if (property?.createdBy !== userId) {
            throw new AccessControlError(
              "Admins can only delete properties they created"
            );
          }
        }
      } else if (!isOwner && !isAdmin) {
        throw new AccessControlError(
          "You don't have permission to perform this action"
        );
      }
    } else {
      const group = await db.query.groupsTable.findFirst({
        where: eq(GroupsTable.id, groupId),
      });

      if (!group) {
        throw new AccessControlError("Group not found", 404);
      }

      const userRole = await db.query.groupMemberRolesTable.findFirst({
        where: and(
          eq(GroupMemberRolesTable.groupId, groupId),
          eq(GroupMemberRolesTable.userId, userId)
        ),
      });

      if (group.ownerId !== userId && userRole?.role !== "admin") {
        throw new AccessControlError(
          "You don't have permission to perform this action"
        );
      }
    }

    next();
  } catch (error) {
    handleError(error, res);
  }
};

export const checkGroupMembership = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { groupId, propertyId } = req.params;
    const userId = res.locals.userId;

    if (propertyId) {
      // If propertyId is provided, check property's group membership
      const property = await db.query.propertyTable.findFirst({
        where: eq(PropertyTable.propertyId, propertyId),
      });

      if (!property) {
        return res.status(404).json({ error: "Property not found" });
      }

      // Check if user is a member of the property's group
      const membership = await db.query.groupMembersTable.findFirst({
        where: and(
          eq(GroupMembersTable.groupId, property.groupId),
          eq(GroupMembersTable.userId, userId)
        ),
      });

      if (!membership) {
        return res.status(403).json({
          error: "You don't have permission to access this property",
        });
      }
    } else if (groupId) {
      // If only groupId is provided, check direct group membership
      const membership = await db.query.groupMembersTable.findFirst({
        where: and(
          eq(GroupMembersTable.groupId, groupId),
          eq(GroupMembersTable.userId, userId)
        ),
      });

      if (!membership) {
        return res.status(403).json({
          error: "You don't have permission to access this group",
        });
      }
    } else {
      return res.status(400).json({
        error: "Either groupId or propertyId must be provided",
      });
    }

    next();
  } catch (error) {
    console.error("Error checking group membership:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const getPropertyIdFromRequest = async (req: Request): Promise<string> => {
  const propertyId =
    req.params.propertyId ||
    req.body.propertyId ||
    (req.query.propertyId as string);

  if (propertyId) return propertyId;

  if (req.params.stayId) {
    const stay = await db
      .select()
      .from(StaysTable)
      .where(eq(StaysTable.stayId, req.params.stayId))
      .limit(1);

    if (!stay.length) {
      throw new AccessControlError("Stay not found", 404);
    }

    return stay[0].propertyId;
  }

  throw new AccessControlError("Property ID is required", 400);
};

const isValidGroupRole = (role: string): role is GroupRole => {
  return ["admin", "owner", "member"].includes(role);
};

const checkUserPropertyAccess = async (
  propertyId: string,
  userId: string
): Promise<GroupRole | null> => {
  const property = await db
    .select()
    .from(PropertyTable)
    .where(eq(PropertyTable.propertyId, propertyId))
    .limit(1);

  if (!property.length) {
    throw new AccessControlError("Property not found", 404);
  }

  const membership = await db
    .select({
      member: GroupMembersTable,
      role: GroupMemberRolesTable.role,
    })
    .from(GroupMembersTable)
    .leftJoin(
      GroupMemberRolesTable,
      and(
        eq(GroupMemberRolesTable.userId, GroupMembersTable.userId),
        eq(GroupMemberRolesTable.groupId, GroupMembersTable.groupId)
      )
    )
    .where(
      and(
        eq(GroupMembersTable.groupId, property[0].groupId),
        eq(GroupMembersTable.userId, userId)
      )
    )
    .limit(1);

  if (!membership.length) {
    throw new AccessControlError(
      "You don't have permission to access this property"
    );
  }

  const role = membership[0].role;
  if (role !== null && !isValidGroupRole(role)) {
    throw new AccessControlError("Invalid role type detected");
  }
  return role;
};

export const checkPropertyAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const propertyId = await getPropertyIdFromRequest(req);
    const userRole = await checkUserPropertyAccess(
      propertyId,
      res.locals.userId
    );

    // Check permissions for POST requests to specific endpoints
    if (
      req.method === "POST" &&
      (req.path === "/guests" ||
        req.path === "/cleaning" ||
        req.path.includes("/cleaning"))
    ) {
      if (userRole !== "admin" && userRole !== "owner") {
        throw new AccessControlError(
          "Only admins and owners can perform this action"
        );
      }
    }

    next();
  } catch (error) {
    handleError(error, res);
  }
};

export const attachCleaningNotificationDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next();
    }

    // Get the cleaning notification to check property access
    const [notification] = await db
      .select()
      .from(CleaningNotificationsTable)
      .where(eq(CleaningNotificationsTable.id, id))
      .limit(1);

    if (!notification) {
      return res.status(404).json({ error: "Cleaning notification not found" });
    }

    // Add propertyId to request body for checkPropertyAccess middleware
    req.body.propertyId = notification.propertyId;
    next();
  } catch (error) {
    console.error("Error fetching cleaning notification:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch cleaning notification" });
  }
};
