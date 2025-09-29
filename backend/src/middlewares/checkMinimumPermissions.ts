import { NextFunction, Request, Response } from "express";
import { db } from "../drizzle/db";
import { RoleTable } from "../users/schema";
import { eq } from "drizzle-orm";
import { handleError } from "../shared/http";

//todo zod validation

export const checkMinimumPermissions =
  (minimumPermissions: number) =>
  async (_: Request, res: Response, next: NextFunction) => {
    try {
      const roleId = res.locals.roleId;
      try {
        const role = await db.query.rolesTable.findFirst({
          where: eq(RoleTable.id, roleId),
        });

        if (role?.permissionsId && role?.permissionsId >= minimumPermissions) {
          next();
        } else {
          return handleError(
            res,
            "You are not authorized to access this resource or you are not a premium user",
            401,
            "You are not authorized to access this resource or you are not a premium user"
          );
        }
      } catch (error) {
        console.log(error);
        return handleError(res, "Unauthorized", 401, "Unauthorized");
      }
    } catch (error) {
      console.log(error);
      return handleError(res, "Server error", 500, "Server error");
    }
  };
