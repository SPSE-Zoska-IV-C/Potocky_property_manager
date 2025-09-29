import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq } from "drizzle-orm";
import { UsersTable } from "../../users/schema";
import util from "../../utils/helpers";
import { handleError } from "../../shared/http";

export const changePassword = async (req: Request, res: Response) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;

    const user = await db.query.usersTable.findFirst({
      where: eq(UsersTable.id, userId),
    });

    if (!user || !util.verifyPasswordWithHash(oldPassword, user.password)) {
      throw new Error("Invalid user or password");
    }

    const hashedPassword = util.createPasswordHash(newPassword);
    await db
      .update(UsersTable)
      .set({ password: hashedPassword })
      .where(eq(UsersTable.id, userId));

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    handleError(res, error, 500, "Error changing password");
  }
};
