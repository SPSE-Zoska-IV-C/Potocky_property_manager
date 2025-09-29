import { eq, and } from "drizzle-orm";
import { db } from "../drizzle/db";
import { UsersTable } from "../users/schema";
import { GroupsTable, GroupMemberRolesTable } from "../properties/schema";

export const findGroup = async (groupId: string) => {
  const group = await db.query.groupsTable.findFirst({
    where: eq(GroupsTable.id, groupId),
  });
  if (!group) throw new Error("Group not found");
  return group;
};

export const checkUserPermissions = async (groupId: string, userId: string) => {
  const group = await findGroup(groupId);
  const isOwner = group.ownerId === userId;

  const userRole = await db.query.groupMemberRolesTable.findFirst({
    where: and(
      eq(GroupMemberRolesTable.groupId, groupId),
      eq(GroupMemberRolesTable.userId, userId)
    ),
  });

  const isAdmin = userRole?.role === "admin";
  if (!isOwner && !isAdmin) {
    throw new Error("Insufficient permissions");
  }
  return { isOwner, isAdmin, group };
};

export const checkPremiumStatusForGroups = async (userId: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(UsersTable.id, userId),
  });

  if (!user?.isPremium) {
    const existingGroups = await db.query.groupsTable.findMany({
      where: eq(GroupsTable.ownerId, userId),
    });

    if (existingGroups.length > 0) {
      throw new Error(
        "Free users can only create one group. Please upgrade to premium for unlimited groups."
      );
    }
  }

  return user;
};

export const findUserByUsername = async (username: string) => {
  const user = await db.query.usersTable.findFirst({
    where: eq(UsersTable.username, username),
  });
  if (!user) throw new Error("User not found");
  return user;
};
