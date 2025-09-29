import { NextFunction, Request, Response } from "express";
import { db } from "../drizzle/db";
import { eq } from "drizzle-orm";
import { UsersTable } from "../users/schema";
import jsonwebtoken from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";
import { handleError } from "../shared/http";

export const checkIsLoggedIn = async (
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

    if (!user || !decodedToken.userId || !decodedToken.username) {
      return handleError(res, "Unauthorized", 401, "Unauthorized");
    } else if (!user.isActive) {
      return handleError(
        res,
        "Account deactivated please contact admin",
        401,
        "Account deactivated please contact admin"
      );
    }

    res.locals.username = user.username;
    res.locals.userId = user.id;
    res.locals.isAdmin = user.isAdmin;
    res.locals.roleId = user.roleId;
    next();
  } catch (error) {
    console.log(error);
    // Clear the invalid token cookie
    res.clearCookie("token");
    return handleError(res, "Invalid token", 401, "Invalid token");
  }
};
