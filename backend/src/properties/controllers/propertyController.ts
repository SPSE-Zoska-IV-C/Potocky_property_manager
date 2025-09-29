import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq, inArray, exists, and } from "drizzle-orm";
import { UsersTable } from "../../users/schema";
import {
  PropertyTable,
  GroupPropertyPermissionsTable,
  GroupsTable,
  GroupMembersTable,
  GroupMemberRolesTable,
} from "../schema";
import { PropertySchema } from "../schema";
import { handleError } from "../../shared/http";

export const createProperty = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;
    const { groupId } = req.params;

    // Check if user is premium
    const user = await db.query.usersTable.findFirst({
      where: eq(UsersTable.id, userId),
    });

    if (!user?.isPremium) {
      // Check if user already has a property
      const existingProperties = await db.query.propertyTable.findMany({
        where: eq(PropertyTable.createdBy, userId),
      });

      if (existingProperties.length > 0) {
        return handleError(
          res,
          new Error(
            "Free users can only create one property. Please upgrade to premium for unlimited properties."
          ),
          403,
          "Free users can only create one property. Please upgrade to premium for unlimited properties."
        );
      }
    }

    // Get the group
    const group = await db.query.groupsTable.findFirst({
      where: eq(GroupsTable.id, groupId),
    });

    if (!group) {
      return handleError(
        res,
        new Error("Group not found"),
        404,
        "Group not found"
      );
    }

    // Check if user is owner or admin
    const isOwner = group.ownerId === userId;
    const userRole = await db.query.groupMemberRolesTable.findFirst({
      where: and(
        eq(GroupMemberRolesTable.groupId, groupId),
        eq(GroupMemberRolesTable.userId, userId)
      ),
    });

    const isAdmin = userRole?.role === "admin";

    if (!isOwner && !isAdmin) {
      return handleError(
        res,
        new Error("Only group owners and admins can create properties"),
        403,
        "Only group owners and admins can create properties"
      );
    }

    // Validate property data
    const result = PropertySchema.safeParse(req.body);
    if (!result.success) {
      return handleError(
        res,
        new Error("Invalid property data"),
        400,
        "Invalid property data"
      );
    }

    // Create the property
    const property = await db
      .insert(PropertyTable)
      .values({
        ...result.data,
        groupId,
        createdBy: userId,
      })
      .returning();

    // Add property to group permissions
    await db.insert(GroupPropertyPermissionsTable).values({
      propertyId: property[0].propertyId,
      groupId,
    });

    return res.status(201).json({ property: property[0] });
  } catch (error) {
    return handleError(res, error, 500, "Failed to create property");
  }
};

export const listProperties = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;

    // Get all groups the user is a member of
    const userGroups = await db
      .select({
        groupId: GroupMembersTable.groupId,
      })
      .from(GroupMembersTable)
      .where(eq(GroupMembersTable.userId, userId));

    const groupIds = userGroups.map((g) => g.groupId);

    if (groupIds.length === 0) {
      return res.json({ properties: [] });
    }

    // Get properties from all groups the user is a member of, along with their groups
    const properties = await db
      .select({
        propertyId: PropertyTable.propertyId,
        groupId: PropertyTable.groupId,
        name: PropertyTable.name,
        address: PropertyTable.address,
        isRented: PropertyTable.isRented,
        pricePerDay: PropertyTable.pricePerDay,
        dateCreated: PropertyTable.dateCreated,
        lastDateRented: PropertyTable.lastDateRented,
        lastDayCleaned: PropertyTable.lastDayCleaned,
        size: PropertyTable.size,
        rooms: PropertyTable.rooms,
        loan: PropertyTable.loan,
        propertySellPriceNow: PropertyTable.propertySellPriceNow,
        propertyBuyPrice: PropertyTable.propertyBuyPrice,
        isOwner: eq(GroupsTable.ownerId, userId),
        role: GroupMemberRolesTable.role,
      })
      .from(PropertyTable)
      .leftJoin(GroupsTable, eq(PropertyTable.groupId, GroupsTable.id))
      .leftJoin(
        GroupMemberRolesTable,
        and(
          eq(GroupMemberRolesTable.groupId, PropertyTable.groupId),
          eq(GroupMemberRolesTable.userId, userId)
        )
      )
      .where(inArray(PropertyTable.groupId, groupIds));

    return res.json({ properties });
  } catch (error) {
    return handleError(res, error, 500, "Failed to list properties");
  }
};

export const getProperty = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = res.locals.userId;

    // Get the property
    const property = await db.query.propertyTable.findFirst({
      where: eq(PropertyTable.propertyId, propertyId),
    });

    if (!property) {
      return handleError(
        res,
        new Error("Property not found"),
        404,
        "Property not found"
      );
    }

    // Check if user is a member of the group that owns the property
    const membership = await db.query.groupMembersTable.findFirst({
      where: and(
        eq(GroupMembersTable.groupId, property.groupId),
        eq(GroupMembersTable.userId, userId)
      ),
    });

    if (!membership) {
      return handleError(
        res,
        new Error("You don't have permission to view this property"),
        403,
        "You don't have permission to view this property"
      );
    }

    return res.json({ property });
  } catch (error) {
    return handleError(res, error, 500, "Failed to get property");
  }
};

export const updateProperty = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = res.locals.userId;

    // Get the property
    const property = await db.query.propertyTable.findFirst({
      where: eq(PropertyTable.propertyId, propertyId),
    });

    if (!property) {
      return handleError(
        res,
        new Error("Property not found"),
        404,
        "Property not found"
      );
    }

    // Check if user is either the owner or an admin of the group that owns the property
    const group = await db.query.groupsTable.findFirst({
      where: eq(GroupsTable.id, property.groupId),
    });

    if (!group) {
      return handleError(
        res,
        new Error("Group not found"),
        404,
        "Group not found"
      );
    }

    // Check if user is owner or admin
    const isOwner = group.ownerId === userId;
    const userRole = await db.query.groupMemberRolesTable.findFirst({
      where: and(
        eq(GroupMemberRolesTable.groupId, group.id),
        eq(GroupMemberRolesTable.userId, userId)
      ),
    });

    const isAdmin = userRole?.role === "admin";

    if (!isOwner && !isAdmin) {
      return handleError(
        res,
        new Error("Only group owners and admins can update properties"),
        403,
        "Only group owners and admins can update properties"
      );
    }

    // Validate property data
    const result = PropertySchema.safeParse(req.body);
    if (!result.success) {
      return handleError(
        res,
        new Error("Invalid property data"),
        400,
        "Invalid property data"
      );
    }

    // Update the property
    const updatedProperty = await db
      .update(PropertyTable)
      .set(result.data)
      .where(eq(PropertyTable.propertyId, propertyId))
      .returning();

    return res.json({ property: updatedProperty[0] });
  } catch (error) {
    return handleError(res, error, 500, "Failed to update property");
  }
};

export const updateLastDayCleaned = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    await db
      .update(PropertyTable)
      .set({ lastDayCleaned: new Date() })
      .where(eq(PropertyTable.propertyId, propertyId));
    return res.json({
      message: `Property (${propertyId}) last day cleaned updated successfully`,
    });
  } catch (error) {
    return handleError(res, error, 500, "Failed to update last day cleaned");
  }
};

export const updateLastDateRented = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    await db
      .update(PropertyTable)
      .set({ lastDateRented: new Date() })
      .where(eq(PropertyTable.propertyId, propertyId));
    return res.json({
      message: `Property (${propertyId}) last date rented updated successfully`,
    });
  } catch (error) {
    return handleError(res, error, 500, "Failed to update last date rented");
  }
};

export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const userId = res.locals.userId;

    // Get the property
    const property = await db.query.propertyTable.findFirst({
      where: eq(PropertyTable.propertyId, propertyId),
    });

    if (!property) {
      return handleError(
        res,
        new Error("Property not found"),
        404,
        "Property not found"
      );
    }

    // Check if user is either the owner or an admin of the group that owns the property
    const group = await db.query.groupsTable.findFirst({
      where: eq(GroupsTable.id, property.groupId),
    });

    if (!group) {
      return handleError(
        res,
        new Error("Group not found"),
        404,
        "Group not found"
      );
    }

    // Check if user is owner or admin
    const isOwner = group.ownerId === userId;
    const userRole = await db.query.groupMemberRolesTable.findFirst({
      where: and(
        eq(GroupMemberRolesTable.groupId, group.id),
        eq(GroupMemberRolesTable.userId, userId)
      ),
    });

    const isAdmin = userRole?.role === "admin";

    if (!isOwner && !isAdmin) {
      return handleError(
        res,
        new Error("Only group owners and admins can delete properties"),
        403,
        "Only group owners and admins can delete properties"
      );
    }

    // First delete all property permissions
    await db
      .delete(GroupPropertyPermissionsTable)
      .where(eq(GroupPropertyPermissionsTable.propertyId, propertyId));

    // Then delete the property
    await db
      .delete(PropertyTable)
      .where(eq(PropertyTable.propertyId, propertyId));

    return res.json({ message: "Property deleted successfully" });
  } catch (error) {
    return handleError(res, error, 500, "Failed to delete property");
  }
};
