import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq, and, desc } from "drizzle-orm";
import {
  CleaningNotificationsTable,
  CleaningNotificationSchema,
  PropertyTable,
} from "../schema";
import { UsersTable } from "../../users/schema";
import type { InferModel } from "drizzle-orm";
import { broadcast } from "../../websocket"; // Import broadcast function
import { handleError } from "../../shared/http";

type CleaningNotification = InferModel<typeof CleaningNotificationsTable>;

export const createCleaningNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const validatedData = CleaningNotificationSchema.parse(req.body);
    const userId = res.locals.userId;

    // check if the assigned user exists and is a cleaner
    const assignedUser = await db
      .select()
      .from(UsersTable)
      .where(eq(UsersTable.id, validatedData.assignedTo))
      .limit(1);

    if (!assignedUser.length) {
      return handleError(
        res,
        new Error("Assigned user not found"),
        404,
        "Assigned user not found"
      );
    }

    // create the cleaning notification
    const [notification] = await db
      .insert(CleaningNotificationsTable)
      .values({
        ...validatedData,
        createdBy: userId,
      })
      .returning();

    // Broadcast the new notification
    broadcast({
      type: "CLEANING_UPDATE",
      action: "CREATE",
      payload: notification,
      propertyId: notification.propertyId.toString(), // Include propertyId
    });

    res.status(201).json({ notification });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      "Failed to create cleaning notification"
    );
  }
};

export const updateCleaningNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const validatedData = CleaningNotificationSchema.partial().parse(req.body);

    // first, get the cleaning notification to check property access
    const [existingNotification] = await db
      .select()
      .from(CleaningNotificationsTable)
      .where(eq(CleaningNotificationsTable.id, id))
      .limit(1);

    if (!existingNotification) {
      return handleError(
        res,
        new Error("Cleaning notification not found"),
        404,
        "Cleaning notification not found"
      );
    }

    // add propertyId to request body for checkPropertyAccess middleware
    req.body.propertyId = existingNotification.propertyId;

    // update the notification
    const [notification] = await db
      .update(CleaningNotificationsTable)
      .set({
        ...validatedData,
        ...(validatedData.status === "completed"
          ? { completedDate: new Date() }
          : {}),
      })
      .where(eq(CleaningNotificationsTable.id, id))
      .returning();

    // If the status is being updated to completed, update the property's lastDayCleaned field
    if (validatedData.status === "completed") {
      await db
        .update(PropertyTable)
        .set({
          lastDayCleaned: new Date(),
        })
        .where(eq(PropertyTable.propertyId, existingNotification.propertyId));
    }

    // Broadcast the updated notification
    broadcast({
      type: "CLEANING_UPDATE",
      action: "UPDATE",
      payload: notification,
      propertyId: notification.propertyId.toString(), // Include propertyId
    });

    res.json({ notification });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      "Failed to update cleaning notification"
    );
  }
};

export const getCleaningNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const [notification] = await db
      .select()
      .from(CleaningNotificationsTable)
      .leftJoin(
        PropertyTable,
        eq(CleaningNotificationsTable.propertyId, PropertyTable.propertyId)
      )
      .leftJoin(
        UsersTable,
        eq(CleaningNotificationsTable.assignedTo, UsersTable.id)
      )
      .where(eq(CleaningNotificationsTable.id, id))
      .limit(1);

    if (!notification) {
      return handleError(
        res,
        new Error("Cleaning notification not found"),
        404,
        "Cleaning notification not found"
      );
    }

    res.json({ notification });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      "Failed to fetch cleaning notification"
    );
  }
};

export const listCleaningNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = res.locals.userId;
    const { propertyId } = req.query;

    // build base query with joins to get property and user details
    const query = db
      .select({
        id: CleaningNotificationsTable.id,
        propertyId: CleaningNotificationsTable.propertyId,
        assignedTo: CleaningNotificationsTable.assignedTo,
        stayId: CleaningNotificationsTable.stayId,
        status: CleaningNotificationsTable.status,
        scheduledDate: CleaningNotificationsTable.scheduledDate,
        completedDate: CleaningNotificationsTable.completedDate,
        notes: CleaningNotificationsTable.notes,
        property: {
          name: PropertyTable.name,
          address: PropertyTable.address,
        },
        assignedUser: {
          username: UsersTable.username,
        },
      })
      .from(CleaningNotificationsTable)
      .innerJoin(
        PropertyTable,
        eq(CleaningNotificationsTable.propertyId, PropertyTable.propertyId)
      )
      .innerJoin(
        UsersTable,
        eq(CleaningNotificationsTable.assignedTo, UsersTable.id)
      );

    // Add conditions based on query parameters
    const conditions = [];

    if (propertyId) {
      // If propertyId is specified, show all notifications for that property
      conditions.push(
        eq(CleaningNotificationsTable.propertyId, propertyId as string)
      );
    } else {
      // Otherwise, show notifications assigned to the user
      conditions.push(eq(CleaningNotificationsTable.assignedTo, userId));
    }

    const notifications = await query
      .where(and(...conditions))
      .orderBy(desc(CleaningNotificationsTable.scheduledDate));

    res.json({ notifications });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      "Failed to list cleaning notifications"
    );
  }
};

export const deleteCleaningNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;

    // First, get the cleaning notification to check property access
    const [existingNotification] = await db
      .select()
      .from(CleaningNotificationsTable)
      .where(eq(CleaningNotificationsTable.id, id))
      .limit(1);

    if (!existingNotification) {
      return handleError(
        res,
        new Error("Cleaning notification not found"),
        404,
        "Cleaning notification not found"
      );
    }

    // Add propertyId to request body for checkPropertyAccess middleware
    req.body.propertyId = existingNotification.propertyId;

    const [notification] = await db
      .delete(CleaningNotificationsTable)
      .where(eq(CleaningNotificationsTable.id, id))
      .returning();

    // Broadcast the deletion
    broadcast({
      type: "CLEANING_UPDATE",
      action: "DELETE",
      payload: { id: notification.id },
      propertyId: notification.propertyId.toString(), // Include propertyId
    });

    res.json({ message: "Cleaning notification deleted successfully" });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      "Failed to delete cleaning notification"
    );
  }
};
