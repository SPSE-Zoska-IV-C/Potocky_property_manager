import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq, and } from "drizzle-orm";
import { GroupPropertyPermissionsTable, PropertyTable } from "../schema";
import { handleError } from "../../shared/http";

export const sharePropertyWithGroup = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { groupId } = req.body;

    const existingPermission =
      await db.query.groupPropertyPermissionsTable.findFirst({
        where: and(
          eq(GroupPropertyPermissionsTable.propertyId, propertyId),
          eq(GroupPropertyPermissionsTable.groupId, groupId)
        ),
      });

    if (existingPermission) {
      return res
        .status(400)
        .json({ error: "Property is already shared with this group" });
    }

    // Share property with group
    await db.insert(GroupPropertyPermissionsTable).values({
      propertyId,
      groupId,
    });

    return res.json({ message: "Property shared with group successfully" });
  } catch (error) {
    return handleError(res, error, 500, "Failed to share property with group");
  }
};

export const removeGroupPropertyAccess = async (
  req: Request,
  res: Response
) => {
  try {
    const { propertyId, groupId } = req.params;

    // Property ownership is now checked by middleware
    await db
      .delete(GroupPropertyPermissionsTable)
      .where(
        and(
          eq(GroupPropertyPermissionsTable.propertyId, propertyId),
          eq(GroupPropertyPermissionsTable.groupId, groupId)
        )
      );

    return res.json({ message: "Group access removed successfully" });
  } catch (error) {
    return handleError(res, error, 500, "Failed to remove group access");
  }
};

export const listGroupProperties = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;

    // Group membership is now checked by middleware
    const properties = await db
      .select({
        propertyId: PropertyTable.propertyId,
        name: PropertyTable.name,
        address: PropertyTable.address,
        pricePerDay: PropertyTable.pricePerDay,
        isRented: PropertyTable.isRented,
      })
      .from(GroupPropertyPermissionsTable)
      .innerJoin(
        PropertyTable,
        eq(GroupPropertyPermissionsTable.propertyId, PropertyTable.propertyId)
      )
      .where(eq(GroupPropertyPermissionsTable.groupId, groupId));

    return res.json({ properties });
  } catch (error) {
    return handleError(res, error, 500, "Failed to list group properties");
  }
};
