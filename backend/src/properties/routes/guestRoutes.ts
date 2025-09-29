import { Router } from "express";
import { checkIsLoggedIn } from "../../middlewares/checkIsLoggedIn";
import { checkRolePermissions } from "../../middlewares/checkRolePermissions";
import {
  createGuest,
  updateGuest,
  getGuest,
  searchGuests,
  deleteGuest,
} from "../controllers/guestController";

const router = Router();

// Only owners and admins can manage guests
const GUEST_MANAGEMENT_ROLES = ["owner", "admin"];

router.use(checkIsLoggedIn);

// List/search guests in a group
router.get(
  "/groups/:groupId/guests",
  checkRolePermissions(["owner", "admin", "cleaner", "member"]),
  searchGuests
);

// Create a guest in a group
router.post(
  "/groups/:groupId/guests",
  checkRolePermissions(GUEST_MANAGEMENT_ROLES),
  createGuest
);

// Get a specific guest
router.get(
  "/groups/:groupId/guests/:guestId",
  checkRolePermissions(["owner", "admin", "cleaner", "member"]),
  getGuest
);

// Update a guest
router.put(
  "/groups/:groupId/guests/:guestId",
  checkRolePermissions(GUEST_MANAGEMENT_ROLES),
  updateGuest
);

// Delete a guest
router.delete(
  "/groups/:groupId/guests/:guestId",
  checkRolePermissions(GUEST_MANAGEMENT_ROLES),
  deleteGuest
);

export default router;
