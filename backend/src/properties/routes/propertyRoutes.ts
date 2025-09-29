import { Router } from "express";
import { checkIsLoggedIn } from "../../middlewares/checkIsLoggedIn";
import {
  createProperty,
  listProperties,
  getProperty,
  updateProperty,
  deleteProperty,
} from "../controllers/propertyController";
import {
  checkGroupMembership,
  checkGroupOwnership,
} from "../middlewares/ownershipChecks";

const router = Router();

// List all properties the user has access to through their group memberships
router.get("/", checkIsLoggedIn, listProperties);

// Create a new property (group owners and admins can do this)
router.post(
  "/groups/:groupId",
  checkIsLoggedIn,
  checkGroupOwnership,
  createProperty
);

// Get a specific property (must be a member of the group that owns it)
router.get("/:propertyId", checkIsLoggedIn, checkGroupMembership, getProperty);

// Update a property (group owners and admins can do this)
router.put(
  "/:propertyId",
  checkIsLoggedIn,
  checkGroupOwnership,
  updateProperty
);

// Delete a property (group owners and admins can do this)
router.delete(
  "/:propertyId",
  checkIsLoggedIn,
  checkGroupOwnership,
  deleteProperty
);

export default router;
