import { Router } from "express";
import { checkIsLoggedIn } from "../../middlewares/checkIsLoggedIn";
import { checkRolePermissions } from "../../middlewares/checkRolePermissions";
import {
  createStay,
  updateStay,
  deleteStay,
  listPropertyStays,
  getStay,
  cancelStay,
  completeStay,
  getAnalytics,
} from "../controllers/stayController";

const router = Router();

// only owners and admins can manage stays/bookings
const STAY_MANAGEMENT_ROLES = ["owner", "admin"];

router.use(checkIsLoggedIn);

// analytics endpoint
router.get("/analytics", getAnalytics);

// legacy property-based routes
router.get("/properties/:propertyId", listPropertyStays); // List stays for a property
router.post("/properties/:propertyId", createStay); // Create stay for a property

// direct stay operations
router.get("/:stayId", getStay); // Get specific stay
router.put("/:stayId", updateStay); // Update stay
router.delete("/:stayId", deleteStay); // Delete stay
router.post("/:stayId/cancel", cancelStay); // Cancel stay
router.post("/:stayId/complete", completeStay); // Complete stay

// group-based routes with role permissions
router.post(
  "/groups/:groupId/stays",
  checkRolePermissions(STAY_MANAGEMENT_ROLES),
  createStay
);

router.get(
  "/groups/:groupId/stays",
  checkRolePermissions(["owner", "admin", "cleaner", "member"]),
  listPropertyStays
);

router.get(
  "/groups/:groupId/stays/:stayId",
  checkRolePermissions(["owner", "admin", "cleaner", "member"]),
  getStay
);

router.put(
  "/groups/:groupId/stays/:stayId",
  checkRolePermissions(STAY_MANAGEMENT_ROLES),
  updateStay
);

router.delete(
  "/groups/:groupId/stays/:stayId",
  checkRolePermissions(STAY_MANAGEMENT_ROLES),
  deleteStay
);

// Group-based stay actions
router.post(
  "/groups/:groupId/stays/:stayId/cancel",
  checkRolePermissions(STAY_MANAGEMENT_ROLES),
  cancelStay
);

router.post(
  "/groups/:groupId/stays/:stayId/complete",
  checkRolePermissions(STAY_MANAGEMENT_ROLES),
  completeStay
);

export default router;
