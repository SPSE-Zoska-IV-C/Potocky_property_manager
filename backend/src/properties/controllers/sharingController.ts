import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq, and } from "drizzle-orm";
import {
  PropertyTable,
  PropertyPermissionsTable,
  GroupsTable,
} from "../schema";
import { handleError } from "../../shared/http";

export const shareProperty = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { userId: sharedUserId } = req.body;

    await db.insert(PropertyPermissionsTable).values({
      propertyId,
      userId: sharedUserId,
    });

    return res.json({ message: "Property shared successfully" });
  } catch (error) {
    return handleError(res, error, 500, "Failed to share property");
  }
};

export const removeSharedAccess = async (req: Request, res: Response) => {
  try {
    const { propertyId, userId: sharedUserId } = req.params;
    const userId = res.locals.userId;

    const property = await db
      .select({
        groupId: PropertyTable.groupId,
      })
      .from(PropertyTable)
      .where(eq(PropertyTable.propertyId, propertyId))
      .limit(1);

    if (!property.length) {
      return res.status(404).json({ error: "Property not found" });
    }

    const group = await db
      .select()
      .from(GroupsTable)
      .where(eq(GroupsTable.id, property[0].groupId))
      .limit(1);

    if (!group.length || group[0].ownerId !== userId) {
      return res.status(403).json({
        error: "You don't have permission to modify this property's sharing",
      });
    }

    await db
      .delete(PropertyPermissionsTable)
      .where(
        and(
          eq(PropertyPermissionsTable.propertyId, propertyId),
          eq(PropertyPermissionsTable.userId, sharedUserId)
        )
      );

    return res.json({ message: "Property access removed successfully" });
  } catch (error) {
    return handleError(res, error, 500, "Failed to remove property access");
  }
};
