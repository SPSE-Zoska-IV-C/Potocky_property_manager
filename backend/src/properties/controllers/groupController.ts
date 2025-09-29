import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { eq, and } from "drizzle-orm";
import {
  GroupsTable,
  GroupMembersTable,
  GroupMemberRolesTable,
  GroupPropertyPermissionsTable,
  GroupMemberRoleSchema,
} from "../schema";
import { UsersTable } from "../../users/schema";
import { PropertyTable } from "../schema";
import { GuestsTable } from "../schema"; // Import GuestsTable
import { handleError } from "../../shared/http";
import {
  findGroup,
  checkUserPermissions,
  checkPremiumStatusForGroups,
  findUserByUsername,
} from "../../shared/groups";

export const createGroup = async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const ownerId = res.locals.userId;

    await checkPremiumStatusForGroups(ownerId);

    const group = await db
      .insert(GroupsTable)
      .values({
        name,
        ownerId,
      })
      .returning();

    // Add user as a member
    await db.insert(GroupMembersTable).values({
      groupId: group[0].id,
      userId: ownerId,
    });

    // Assign owner role
    await db.insert(GroupMemberRolesTable).values({
      groupId: group[0].id,
      userId: ownerId,
      role: "owner",
    });

    return res.status(201).json({ group: group[0] });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      error instanceof Error ? error.message : "Failed to create group"
    );
  }
};

export const addMemberToGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { username } = req.body;
    const requestingUserId = res.locals.userId;

    await checkUserPermissions(groupId, requestingUserId);
    const user = await findUserByUsername(username);

    const existingMember = await db.query.groupMembersTable.findFirst({
      where: and(
        eq(GroupMembersTable.groupId, groupId),
        eq(GroupMembersTable.userId, user.id)
      ),
    });

    if (existingMember) {
      return res
        .status(400)
        .json({ error: "User is already a member of this group" });
    }

    await db.insert(GroupMembersTable).values({
      groupId,
      userId: user.id,
    });

    return res.json({ message: "Member added successfully" });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      error instanceof Error ? error.message : "Failed to add member to group"
    );
  }
};

export const removeMemberFromGroup = async (req: Request, res: Response) => {
  try {
    const { groupId, userId } = req.params;
    const requestingUserId = res.locals.userId;

    const { isOwner, isAdmin, group } = await checkUserPermissions(
      groupId,
      requestingUserId
    );

    if (userId === group.ownerId) {
      return handleError(
        res,
        new Error("Cannot remove the group owner"),
        403,
        "Cannot remove the group owner"
      );
    }

    if (!isOwner && isAdmin) {
      const targetUserRole = await db.query.groupMemberRolesTable.findFirst({
        where: and(
          eq(GroupMemberRolesTable.groupId, groupId),
          eq(GroupMemberRolesTable.userId, userId)
        ),
      });

      if (targetUserRole?.role === "admin") {
        return handleError(
          res,
          new Error("Admins cannot remove other admins"),
          403,
          "Admins cannot remove other admins"
        );
      }
    }

    await db
      .delete(GroupMembersTable)
      .where(
        and(
          eq(GroupMembersTable.groupId, groupId),
          eq(GroupMembersTable.userId, userId)
        )
      );

    await db
      .delete(GroupMemberRolesTable)
      .where(
        and(
          eq(GroupMemberRolesTable.groupId, groupId),
          eq(GroupMemberRolesTable.userId, userId)
        )
      );

    return res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      error instanceof Error
        ? error.message
        : "Failed to remove member from group"
    );
  }
};

export const listGroupMembers = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const requestingUserId = res.locals.userId;

    const membership = await db.query.groupMembersTable.findFirst({
      where: and(
        eq(GroupMembersTable.groupId, groupId),
        eq(GroupMembersTable.userId, requestingUserId)
      ),
    });

    if (!membership) {
      return handleError(
        res,
        new Error("You don't have permission to view this group's members"),
        403,
        "You don't have permission to view this group's members"
      );
    }

    const group = await findGroup(groupId);

    const members = await db
      .select({
        id: UsersTable.id,
        username: UsersTable.username,
        dateJoined: GroupMembersTable.dateJoined,
        isOwner: eq(UsersTable.id, group.ownerId),
        role: GroupMemberRolesTable.role,
      })
      .from(GroupMembersTable)
      .innerJoin(UsersTable, eq(GroupMembersTable.userId, UsersTable.id))
      .leftJoin(
        GroupMemberRolesTable,
        and(
          eq(GroupMemberRolesTable.groupId, GroupMembersTable.groupId),
          eq(GroupMemberRolesTable.userId, GroupMembersTable.userId)
        )
      )
      .where(eq(GroupMembersTable.groupId, groupId));

    // Transform the results to set owner's role and ensure other roles are preserved
    const transformedMembers = members.map((member) => ({
      ...member,
      // If member is owner, always return "owner", otherwise use their assigned role or default to "member"
      role: member.isOwner ? "owner" : member.role || "member",
    }));

    return res.status(200).json({ members: transformedMembers });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      error instanceof Error ? error.message : "Failed to list group members"
    );
  }
};

export const listUserGroups = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;

    const groups = await db
      .select({
        id: GroupsTable.id,
        name: GroupsTable.name,
        dateCreated: GroupsTable.dateCreated,
        isOwner: eq(GroupsTable.ownerId, userId),
        role: GroupMemberRolesTable.role,
      })
      .from(GroupMembersTable)
      .innerJoin(GroupsTable, eq(GroupMembersTable.groupId, GroupsTable.id))
      .leftJoin(
        GroupMemberRolesTable,
        and(
          eq(GroupMemberRolesTable.groupId, GroupMembersTable.groupId),
          eq(GroupMemberRolesTable.userId, userId)
        )
      )
      .where(eq(GroupMembersTable.userId, userId));

    return res.status(200).json({ groups });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      error instanceof Error ? error.message : "Failed to list user groups"
    );
  }
};

export const updateMemberRole = async (req: Request, res: Response) => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body;
    const requestingUserId = res.locals.userId;

    // Validate role using the schema
    const validatedData = GroupMemberRoleSchema.parse({ role });

    // Check permissions
    const { isOwner, group } = await checkUserPermissions(
      groupId,
      requestingUserId
    );

    // Check if target user is a member of the group
    const targetMember = await db.query.groupMembersTable.findFirst({
      where: and(
        eq(GroupMembersTable.groupId, groupId),
        eq(GroupMembersTable.userId, userId)
      ),
    });

    if (!targetMember) {
      return handleError(
        res,
        new Error("User is not a member of this group"),
        404,
        "User is not a member of this group"
      );
    }

    // Cannot modify the owner's role
    if (userId === group.ownerId) {
      return handleError(
        res,
        new Error("Cannot modify the group owner's role"),
        403,
        "Cannot modify the group owner's role"
      );
    }

    // First try to update existing role
    const updateResult = await db
      .update(GroupMemberRolesTable)
      .set({ role: validatedData.role })
      .where(
        and(
          eq(GroupMemberRolesTable.groupId, groupId),
          eq(GroupMemberRolesTable.userId, userId)
        )
      )
      .returning();

    // If no existing role was updated, insert a new one
    if (updateResult.length === 0) {
      await db.insert(GroupMemberRolesTable).values({
        groupId,
        userId,
        role: validatedData.role,
      });
    }

    return res.status(200).json({ message: "Role updated successfully" });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      error instanceof Error ? error.message : "Failed to update member role"
    );
  }
};

export const leaveGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = res.locals.userId;

    const group = await findGroup(groupId);

    if (group.ownerId === userId) {
      await db
        .delete(GroupPropertyPermissionsTable)
        .where(eq(GroupPropertyPermissionsTable.groupId, groupId));

      await db.delete(PropertyTable).where(eq(PropertyTable.groupId, groupId));

      await db
        .delete(GroupMemberRolesTable)
        .where(eq(GroupMemberRolesTable.groupId, groupId));

      await db
        .delete(GroupMembersTable)
        .where(eq(GroupMembersTable.groupId, groupId));

      await db.delete(GroupsTable).where(eq(GroupsTable.id, groupId));

      return res.status(200).json({
        message: "Group and all associated data deleted successfully",
      });
    }

    const result = await db
      .delete(GroupMembersTable)
      .where(
        and(
          eq(GroupMembersTable.groupId, groupId),
          eq(GroupMembersTable.userId, userId)
        )
      )
      .returning();

    if (!result.length) {
      return handleError(
        res,
        new Error("You are not a member of this group"),
        404,
        "You are not a member of this group"
      );
    }

    await db
      .delete(GroupMemberRolesTable)
      .where(
        and(
          eq(GroupMemberRolesTable.groupId, groupId),
          eq(GroupMemberRolesTable.userId, userId)
        )
      );

    return res.status(200).json({ message: "Successfully left the group" });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      error instanceof Error ? error.message : "Failed to leave group"
    );
  }
};

export const deleteGroup = async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const userId = res.locals.userId;

    const group = await findGroup(groupId);

    if (group.ownerId !== userId) {
      return handleError(
        res,
        new Error("Only group owners can delete their groups"),
        403,
        "Only group owners can delete their groups"
      );
    }

    // Delete in correct order to respect foreign key constraints
    // First, delete guests associated with the group
    await db.delete(GuestsTable).where(eq(GuestsTable.groupId, groupId));

    // Then delete property permissions
    await db
      .delete(GroupPropertyPermissionsTable)
      .where(eq(GroupPropertyPermissionsTable.groupId, groupId));

    // Delete properties
    await db.delete(PropertyTable).where(eq(PropertyTable.groupId, groupId));

    // Delete member roles
    await db
      .delete(GroupMemberRolesTable)
      .where(eq(GroupMemberRolesTable.groupId, groupId));

    // Delete group members
    await db
      .delete(GroupMembersTable)
      .where(eq(GroupMembersTable.groupId, groupId));

    // Finally delete the group itself
    await db.delete(GroupsTable).where(eq(GroupsTable.id, groupId));

    return res.status(200).json({
      message: "Group and all associated data deleted successfully",
    });
  } catch (error) {
    return handleError(
      res,
      error,
      500,
      error instanceof Error ? error.message : "Failed to delete group"
    );
  }
};
