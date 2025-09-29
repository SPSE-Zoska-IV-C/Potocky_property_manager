import { NextFunction, Request, Response } from "express";
import { db } from "../drizzle/db";
import { eq } from "drizzle-orm";
import { UsersTable } from "../users/schema";
import jsonwebtoken from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";
import { handleError } from "../shared/http";

export const checkIsWebAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return handleError(res, "Unauthorized", 401, "Unauthorized");
    }

    const decodedToken = (await jsonwebtoken.verify(
      token,
      process.env.JWT_SECRET || ""
    )) as JwtPayload;
    const user = await db.query.usersTable.findFirst({
      where: eq(UsersTable.id, decodedToken.userId),
    });

    if (
      !user ||
      !decodedToken.userId ||
      !decodedToken.username ||
      !user.isWebAdmin
    ) {
      return handleError(
        res,
        "You can't access do this!",
        401,
        "You can't access do this!"
      );
    } else if (!user.isActive) {
      return handleError(
        res,
        "Account deactivated please contact admin",
        401,
        "Account deactivated please contact admin"
      );
    }

    next();
  } catch (error) {
    console.log(error);
    return handleError(
      res,
      "You can't access do this!",
      401,
      "You can't access do this!"
    );
  }
};
