import { NextFunction, Request, Response } from "express";
import { db } from "../drizzle/db";
import { eq } from "drizzle-orm";
import { UsersTable } from "../users/schema";
import jsonwebtoken from "jsonwebtoken";
import { JwtPayload } from "jsonwebtoken";
import { handleError } from "../shared/http";

//todo zod validation

export const checkIsAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.token;

    const decodedToken = (await jsonwebtoken.verify(
      token,
      process.env.JWT_SECRET || ""
    )) as JwtPayload;
    const user = await db.query.usersTable.findFirst({
      where: eq(UsersTable.id, decodedToken.userId),
    });

    // check if user exists and has valid token data
    if (!user || !decodedToken.userId || !decodedToken.username) {
      return handleError(res, "Unauthorized", 401, "Unauthorized");
    }
    // check admin status from database user object
    if (!user.isAdmin) {
      return handleError(
        res,
        "You are not authorized to access this resource",
        401,
        "You are not authorized to access this resource"
      );
    }

    next();
  } catch (error) {
    console.log(error);
    return handleError(res, "Unauthorized", 401, "Unauthorized");
  }
};
