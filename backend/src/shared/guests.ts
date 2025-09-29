import { eq } from "drizzle-orm";
import { db } from "../drizzle/db";
import { GuestsTable } from "../properties/schema";

export const ensureGuestExists = async (guestId: string) => {
  const existing = await db
    .select()
    .from(GuestsTable)
    .where(eq(GuestsTable.guestId, guestId))
    .limit(1);
  if (!existing.length) {
    throw new Error("Guest not found");
  }
  return existing[0];
};
