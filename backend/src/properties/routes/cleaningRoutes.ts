import { Router } from "express";
import { checkIsLoggedIn } from "../../middlewares/checkIsLoggedIn";
import { checkRolePermissions } from "../../middlewares/checkRolePermissions";
import {
  createCleaningNotification,
  updateCleaningNotification,
  deleteCleaningNotification,
  listCleaningNotifications,
} from "../controllers/cleaningController";

const router = Router();

// Only owners and admins can manage cleaning schedules
const CLEANING_MANAGEMENT_ROLES = ["owner", "admin"];

router.use(checkIsLoggedIn);

// Legacy property-based routes
router.get("/", listCleaningNotifications); // List cleanings for a property
router.post("/", createCleaningNotification); // Create cleaning notification
router.put("/:id", updateCleaningNotification); // Update cleaning notification
router.delete("/:id", deleteCleaningNotification); // Delete cleaning notification

// Group-based routes with role permissions
router.post(
  "/groups/:groupId/cleanings",
  checkRolePermissions(CLEANING_MANAGEMENT_ROLES),
  createCleaningNotification
);

router.get(
  "/groups/:groupId/cleanings",
  checkRolePermissions(["owner", "admin", "cleaner", "member"]),
  listCleaningNotifications
);

router.put(
  "/groups/:groupId/cleanings/:cleaningId",
  checkRolePermissions(["owner", "admin", "cleaner"]),
  updateCleaningNotification
);

router.delete(
  "/groups/:groupId/cleanings/:cleaningId",
  checkRolePermissions(CLEANING_MANAGEMENT_ROLES),
  deleteCleaningNotification
);

export default router;
