import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import {
  StaysTable,
  StaySchema,
  PropertyTable,
  GroupMembersTable,
} from "../schema";
import type { InferModel } from "drizzle-orm";
import { handleError } from "../../shared/http";

type NewStay = InferModel<typeof StaysTable, "insert">;

// Helper function to check for booking conflicts
const checkBookingConflicts = async (
  propertyId: string,
  checkIn: Date,
  checkOut: Date,
  excludeStayId?: string
) => {
  const conflictingStays = await db
    .select()
    .from(StaysTable)
    .where(
      and(
        eq(StaysTable.propertyId, propertyId),
        sql`(
          ("checkIn" <= ${checkOut.toISOString()} AND "checkOut" >= ${checkIn.toISOString()})
          AND
          "status" NOT IN ('cancelled', 'completed')
          ${excludeStayId ? sql`AND "stayId" != ${excludeStayId}` : sql``}
        )`
      )
    );

  return conflictingStays.length > 0;
};

export const createStay = async (req: Request, res: Response) => {
  try {
    const result = StaySchema.safeParse(req.body);
    if (!result.success) {
      return handleError(
        res,
        new Error("Invalid stay data"),
        400,
        "Invalid stay data"
      );
    }

    const { propertyId, checkInDate, checkOutDate, ...rest } = result.data;

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn >= checkOut) {
      return handleError(
        res,
        new Error("Check-out date must be after check-in date"),
        400,
        "Check-out date must be after check-in date"
      );
    }

    // Check for booking conflicts
    const hasConflicts = await checkBookingConflicts(
      propertyId,
      checkIn,
      checkOut
    );

    if (hasConflicts) {
      return handleError(
        res,
        new Error("Property is already booked for the selected dates"),
        409,
        "Property is already booked for the selected dates"
      );
    }

    // Create the stay
    const [newStay] = await db
      .insert(StaysTable)
      .values({
        propertyId,
        guestId: rest.guestId,
        checkIn: sql`${checkInDate}::date`,
        checkOut: sql`${checkOutDate}::date`,
        totalPrice: rest.totalPrice,
        status: "upcoming",
        paymentStatus: "pending",
        numberOfGuests: rest.numberOfGuests,
        specialRequests: rest.specialRequests,
        createdBy: res.locals.userId,
        createdAt: sql`CURRENT_TIMESTAMP`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .returning();

    // Update property status
    await db
      .update(PropertyTable)
      .set({
        isRented: true,
        lastDateRented: new Date(),
      })
      .where(eq(PropertyTable.propertyId, propertyId));

    return res.status(201).json({ stay: newStay });
  } catch (error) {
    return handleError(res, error, 500, "Failed to create stay");
  }
};

export const updateStay = async (req: Request, res: Response) => {
  try {
    const { stayId } = req.params;
    const result = StaySchema.safeParse(req.body);
    if (!result.success) {
      return handleError(
        res,
        new Error("Invalid stay data"),
        400,
        "Invalid stay data"
      );
    }

    const { propertyId, checkInDate, checkOutDate, ...rest } = result.data;
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Validate dates
    if (checkIn >= checkOut) {
      return handleError(
        res,
        new Error("Check-out date must be after check-in date"),
        400,
        "Check-out date must be after check-in date"
      );
    }

    // Only check for booking conflicts if we're not cancelling the stay
    if (rest.status !== "cancelled") {
      const hasConflicts = await checkBookingConflicts(
        propertyId,
        checkIn,
        checkOut,
        stayId
      );

      if (hasConflicts) {
        return handleError(
          res,
          new Error("Property is already booked for the selected dates"),
          409,
          "Property is already booked for the selected dates"
        );
      }
    }

    const stay = await db
      .update(StaysTable)
      .set({
        propertyId: propertyId as string,
        guestId: rest.guestId as string,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        totalPrice: rest.totalPrice as number,
        status: rest.status || "upcoming",
        paymentStatus: rest.paymentStatus || "pending",
        numberOfGuests: rest.numberOfGuests as number,
        specialRequests: rest.specialRequests,
        updatedAt: new Date(),
      })
      .where(eq(StaysTable.stayId, stayId))
      .returning();

    if (!stay.length) {
      return handleError(
        res,
        new Error("Stay not found"),
        404,
        "Stay not found"
      );
    }

    return res.json({ stay: stay[0] });
  } catch (error) {
    return handleError(res, error, 500, "Failed to update stay");
  }
};

export const getStay = async (req: Request, res: Response) => {
  try {
    const { stayId } = req.params;

    const stay = await db
      .select()
      .from(StaysTable)
      .where(eq(StaysTable.stayId, stayId))
      .limit(1);

    if (!stay.length) {
      return handleError(
        res,
        new Error("Stay not found"),
        404,
        "Stay not found"
      );
    }

    return res.json({ stay: stay[0] });
  } catch (error) {
    return handleError(res, error, 500, "Failed to get stay");
  }
};

export const deleteStay = async (req: Request, res: Response) => {
  try {
    const { stayId } = req.params;

    // First check if the stay exists and is cancelled
    const existingStay = await db
      .select()
      .from(StaysTable)
      .where(eq(StaysTable.stayId, stayId))
      .limit(1);

    if (!existingStay.length) {
      return handleError(
        res,
        new Error("Stay not found"),
        404,
        "Stay not found"
      );
    }

    if (existingStay[0].status !== "cancelled") {
      return handleError(
        res,
        new Error("Only cancelled stays can be deleted"),
        400,
        "Only cancelled stays can be deleted"
      );
    }

    // Delete the stay
    await db.delete(StaysTable).where(eq(StaysTable.stayId, stayId));

    return res.json({ message: "Stay deleted successfully" });
  } catch (error) {
    return handleError(res, error, 500, "Failed to delete stay");
  }
};

export const listPropertyStays = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;
    const { status } = req.query;

    let stays = await db
      .select()
      .from(StaysTable)
      .where(eq(StaysTable.propertyId, propertyId))
      .orderBy(desc(StaysTable.checkIn)); // Sort by check-in date, newest first

    if (status) {
      stays = stays.filter((stay) => stay.status === status);
    }

    return res.json({ stays });
  } catch (error) {
    return handleError(res, error, 500, "Failed to list stays");
  }
};

export const cancelStay = async (req: Request, res: Response) => {
  try {
    const { stayId } = req.params;

    const stay = await db
      .update(StaysTable)
      .set({
        status: "cancelled",
        updatedAt: new Date(),
      })
      .where(eq(StaysTable.stayId, stayId))
      .returning();

    if (!stay.length) {
      return handleError(
        res,
        new Error("Stay not found"),
        404,
        "Stay not found"
      );
    }

    // Check if there are any active stays for this property
    const activeStays = await db
      .select()
      .from(StaysTable)
      .where(
        and(
          eq(StaysTable.propertyId, stay[0].propertyId),
          eq(StaysTable.status, "active")
        )
      );

    // If no active stays, update property status
    if (!activeStays.length) {
      await db
        .update(PropertyTable)
        .set({
          isRented: false,
        })
        .where(eq(PropertyTable.propertyId, stay[0].propertyId));
    }

    return res.json({ stay: stay[0] });
  } catch (error) {
    return handleError(res, error, 500, "Failed to cancel stay");
  }
};

export const completeStay = async (req: Request, res: Response) => {
  try {
    const { stayId } = req.params;

    const stay = await db
      .update(StaysTable)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(StaysTable.stayId, stayId))
      .returning();

    if (!stay.length) {
      return handleError(
        res,
        new Error("Stay not found"),
        404,
        "Stay not found"
      );
    }

    // Check if there are any active stays for this property
    const activeStays = await db
      .select()
      .from(StaysTable)
      .where(
        and(
          eq(StaysTable.propertyId, stay[0].propertyId),
          eq(StaysTable.status, "active")
        )
      );

    // If no active stays, update property status
    if (!activeStays.length) {
      await db
        .update(PropertyTable)
        .set({
          isRented: false,
        })
        .where(eq(PropertyTable.propertyId, stay[0].propertyId));
    }

    return res.json({ stay: stay[0] });
  } catch (error) {
    return handleError(res, error, 500, "Failed to complete stay");
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;

    // Get all properties the user has access to through group membership
    const userGroups = await db
      .select()
      .from(GroupMembersTable)
      .where(eq(GroupMembersTable.userId, userId));

    const groupIds = userGroups.map((group) => group.groupId);

    // Get all properties from these groups
    const properties = await db
      .select()
      .from(PropertyTable)
      .where(inArray(PropertyTable.groupId, groupIds));

    const propertyIds = properties.map((prop) => prop.propertyId);

    // Get all stays for these properties
    const stays = await db
      .select()
      .from(StaysTable)
      .where(inArray(StaysTable.propertyId, propertyIds))
      .orderBy(StaysTable.checkIn);

    res.json({ stays });
  } catch (error) {
    return handleError(res, error, 500, "Failed to fetch analytics data");
  }
};
