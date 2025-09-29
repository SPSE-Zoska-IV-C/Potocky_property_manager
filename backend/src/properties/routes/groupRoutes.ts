import { Router } from "express";
import { checkIsLoggedIn } from "../../middlewares/checkIsLoggedIn";
import { checkMinimumPermissions } from "../../middlewares/checkMinimumPermissions";
import {
  createGroup,
  addMemberToGroup,
  removeMemberFromGroup,
  listGroupMembers,
  listUserGroups,
  updateMemberRole,
  leaveGroup,
  deleteGroup,
} from "../controllers/groupController";
import {
  sharePropertyWithGroup,
  removeGroupPropertyAccess,
  listGroupProperties,
} from "../controllers/groupPropertyController";
import {
  checkGroupOwnership,
  checkGroupMembership,
} from "../middlewares/ownershipChecks";
import { db } from "../../drizzle/db";
import { eq, and } from "drizzle-orm";
import { GroupMembersTable, GroupMemberRolesTable } from "../schema";
import { UsersTable } from "../../users/schema";

const router = Router();

// group management routes
router.post(
  "/create",
  checkIsLoggedIn,
  // checkMinimumPermissions(101),
  createGroup
);

router.get("/my-groups", checkIsLoggedIn, listUserGroups);

// get group members, optionally filtered by role
router.get(
  "/:groupId/members",
  checkIsLoggedIn,
  checkGroupMembership,
  async (req, res) => {
    try {
      const { groupId } = req.params;
      const { role } = req.query;

      // build conditions array
      const conditions = [eq(GroupMembersTable.groupId, groupId)];

      if (typeof role === "string") {
        conditions.push(eq(GroupMemberRolesTable.role, role));
      }

      // execute query with all conditions
      const members = await db
        .select({
          id: UsersTable.id,
          username: UsersTable.username,
          role: GroupMemberRolesTable.role,
          dateJoined: GroupMembersTable.dateJoined,
        })
        .from(GroupMembersTable)
        .innerJoin(UsersTable, eq(GroupMembersTable.userId, UsersTable.id))
        .leftJoin(
          GroupMemberRolesTable,
          and(
            eq(GroupMemberRolesTable.userId, GroupMembersTable.userId),
            eq(GroupMemberRolesTable.groupId, GroupMembersTable.groupId)
          )
        )
        .where(and(...conditions));

      res.json({ members });
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ error: "Failed to fetch group members" });
    }
  }
);

router.post(
  "/:groupId/members",
  checkIsLoggedIn,
  checkMinimumPermissions(101),
  checkGroupOwnership,
  addMemberToGroup
);

router.delete(
  "/:groupId/members/:userId",
  checkIsLoggedIn,
  checkMinimumPermissions(101),
  checkGroupOwnership,
  removeMemberFromGroup
);

// group property routes
router.get(
  "/:groupId/properties",
  checkIsLoggedIn,
  checkGroupMembership,
  listGroupProperties
);

router.post(
  "/properties/:propertyId/share",
  checkIsLoggedIn,
  checkMinimumPermissions(101),
  checkGroupOwnership,
  sharePropertyWithGroup
);

router.delete(
  "/properties/:propertyId/groups/:groupId",
  checkIsLoggedIn,
  checkMinimumPermissions(101),
  checkGroupOwnership,
  removeGroupPropertyAccess
);

// add route for updating member role
router.put(
  "/:groupId/members/:userId/role",
  checkIsLoggedIn,
  checkMinimumPermissions(101),
  checkGroupOwnership,
  updateMemberRole
);

// add route for deleting a group (website admin only)
router.delete("/:groupId", checkIsLoggedIn, deleteGroup);

// add route for leaving a group
router.delete("/:groupId/leave", checkIsLoggedIn, leaveGroup);

export default router;
