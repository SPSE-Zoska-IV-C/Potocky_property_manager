import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq, and, desc, like } from "drizzle-orm";
import { GuestsTable, GuestSchema } from "../schema";
import { handleError } from "../../shared/http";
import { ensureGuestExists } from "../../shared/guests";

// using shared error handler and guest existence checker

export const createGuest = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const result = GuestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid guest data" });
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
    return handleError(res, error, 500, "Failed to create guest");
  }
};

export const updateGuest = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const result = GuestSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid guest data" });
    }

    await ensureGuestExists(guestId);

    const guest = await db
      .update(GuestsTable)
      .set(result.data)
      .where(eq(GuestsTable.guestId, guestId))
      .returning();

    return res.json({ guest: guest[0] });
  } catch (error) {
    return handleError(res, error, 500, "Failed to update guest");
  }
};

export const getGuest = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const guest = await ensureGuestExists(guestId);

    return res.json({ guest });
  } catch (error) {
    return handleError(res, error, 500, "Failed to get guest");
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
    return handleError(res, error, 500, "Failed to search guests");
  }
};

export const deleteGuest = async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    await ensureGuestExists(guestId);

    await db
      .delete(GuestsTable)
      .where(eq(GuestsTable.guestId, guestId))
      .returning();

    return res.json({ message: "Guest deleted successfully" });
  } catch (error) {
    return handleError(res, error, 500, "Failed to delete guest");
  }
};
