import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq, and, desc, like } from "drizzle-orm";
import { GuestsTable, GuestSchema } from "../schema";
import { handleError } from "../../shared/http";

export const createGuest = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const result = GuestSchema.safeParse(req.body);
    if (!result.success) {
      return handleError(res, "Invalid guest data", 400, "Invalid guest data");
    }

    const guest = await db
      .insert(GuestsTable)
      .values({
        ...result.data,
        groupId,
        createdBy: res.locals.userId,
      })
      .returning();

    return res.status(201).json({ guest: guest[0] });
  } catch (error) {
    console.error("Error creating guest:", error);
    return handleError(
      res,
      "Failed to create guest",
      500,
      "Failed to create guest"
    );
  }
};

export const updateGuest = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const result = GuestSchema.safeParse(req.body);
    if (!result.success) {
      return handleError(res, "Invalid guest data", 400, "Invalid guest data");
    }

    // First, get the guest to check their group
    const existingGuest = await db
      .select()
      .from(GuestsTable)
      .where(eq(GuestsTable.guestId, guestId))
      .limit(1);

    if (!existingGuest.length) {
      return handleError(res, "Guest not found", 404, "Guest not found");
    }

    const guest = await db
      .update(GuestsTable)
      .set(result.data)
      .where(eq(GuestsTable.guestId, guestId))
      .returning();

    return res.json({ guest: guest[0] });
  } catch (error) {
    console.error("Error updating guest:", error);
    return handleError(
      res,
      "Failed to update guest",
      500,
      "Failed to update guest"
    );
  }
};

export const getGuest = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    const guest = await db
      .select()
      .from(GuestsTable)
      .where(eq(GuestsTable.guestId, guestId))
      .limit(1);

    if (!guest.length) {
      return handleError(res, "Guest not found", 404, "Guest not found");
    }

    return res.json({ guest: guest[0] });
  } catch (error) {
    console.error("Error getting guest:", error);
    return handleError(res, "Failed to get guest", 500, "Failed to get guest");
  }
};

export const searchGuests = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { query } = req.query;
    const searchQuery = query ? `%${query}%` : "%";

    const guests = await db
      .select()
      .from(GuestsTable)
      .where(
        and(
          eq(GuestsTable.groupId, groupId),
          query
            ? like(GuestsTable.firstName, searchQuery) ||
                like(GuestsTable.lastName, searchQuery) ||
                like(GuestsTable.email, searchQuery)
            : undefined
        )
      )
      .orderBy(desc(GuestsTable.createdAt))
      .limit(50);

    return res.json({ guests });
  } catch (error) {
    console.error("Error searching guests:", error);
    return handleError(
      res,
      "Failed to search guests",
      500,
      "Failed to search guests"
    );
  }
};

export const deleteGuest = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;

    // First, get the guest to check their group
    const existingGuest = await db
      .select()
      .from(GuestsTable)
      .where(eq(GuestsTable.guestId, guestId))
      .limit(1);

    if (!existingGuest.length) {
      return handleError(res, "Guest not found", 404, "Guest not found");
    }

    const guest = await db
      .delete(GuestsTable)
      .where(eq(GuestsTable.guestId, guestId))
      .returning();

    return res.json({ message: "Guest deleted successfully" });
  } catch (error) {
    console.error("Error deleting guest:", error);
    return handleError(
      res,
      "Failed to delete guest",
      500,
      "Failed to delete guest"
    );
  }
};
