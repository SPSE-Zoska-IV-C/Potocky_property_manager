import { Request, Response, NextFunction } from "express";
import { db } from "../../drizzle/db";
import { eq } from "drizzle-orm";
import {
  UsersTable,
  UserLoginSchema,
  UserRegisterSchema,
} from "../../users/schema";
import util from "../../utils/helpers";
import jsonwebtoken from "jsonwebtoken";
import { handleError } from "../../shared/http";

export const login = async (req: Request, res: Response) => {
  try {
    const validatedData = UserLoginSchema.parse(req.body);
    const { username, password } = validatedData;

    const user = await db.query.usersTable.findFirst({
      where: eq(UsersTable.username, username),
    });

    if (!user || !util.verifyPasswordWithHash(password, user.password)) {
      throw new Error("Invalid username or password");
    }
    await db
      .update(UsersTable)
      .set({
        lastLogin: new Date(),
        lastIp:
          req.headers["x-forwarded-for"]?.toString().split(",")[0] ||
          req.socket.remoteAddress ||
          req.ip,
      })
      .where(eq(UsersTable.id, user.id));

    const token = jsonwebtoken.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || "",
      { expiresIn: "30d" }
    );

    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      isPremium: user.isPremium,
    };

    if (user.isActive === false) {
      // tu nebude handleerror pretoze vraca error:message nie message:message
      res
        .status(401)
        .json({ message: "Account deactivated please contact admin" });
      return;
    }

    res.cookie("token", token);
    res.json({ message: "Login successful", user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ message: "Incorrect username or password" });
  }
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = UserRegisterSchema.parse(req.body);
    const { username, email, password } = validatedData;

    // Check for existing username or email
    const [userExists, emailExists] = await Promise.all([
      db.query.usersTable.findFirst({
        where: eq(UsersTable.username, username),
      }),
      db.query.usersTable.findFirst({
        where: eq(UsersTable.email, email),
      }),
    ]);

    if (userExists) {
      throw new Error("Username already exists");
    }

    if (emailExists) {
      throw new Error("Email already registered");
    }

    const hashedPassword = util.createPasswordHash(password);
    await db.insert(UsersTable).values({
      username,
      email,
      password: hashedPassword,
      emailVerified: false,
    });

    res.json({ message: "User created successfully" });
  } catch (error) {
    next(error);
  }
};

export const logout = async (_: Request, res: Response) => {
  try {
    res.clearCookie("token");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    handleError(res, error, 500, "Error logging out");
  }
};
