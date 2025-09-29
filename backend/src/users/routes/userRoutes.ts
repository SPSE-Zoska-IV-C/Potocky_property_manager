import { Router } from "express";
import { 
  getAllUsers, 
  getCurrentUser, 
  makeUserAdmin, 
  setUserPremium,
  createRole,
  getAllRoles,
  deleteRole,
  addRoleToUser,
  updateUserInfo 
} from "../controllers/userController";
import { checkIsLoggedIn } from "../../middlewares/checkIsLoggedIn";
import { checkIsWebAdmin } from "../../middlewares/checkIsWebAdmin";
import { checkMinimumPermissions } from "../../middlewares/checkMinimumPermissions";
import { checkIsAdmin } from "../../middlewares/checkIsAdmin";

export const router = Router();

// user routes
router.get("/", checkIsLoggedIn, checkMinimumPermissions(102), getAllUsers);
router.get("/current", checkIsLoggedIn, getCurrentUser);
router.get("/make-admin", checkIsLoggedIn, checkMinimumPermissions(102), checkIsWebAdmin, makeUserAdmin);
router.get("/setIsPremium", checkIsLoggedIn, checkIsWebAdmin, checkMinimumPermissions(102), setUserPremium);
router.put("/update", checkIsLoggedIn, updateUserInfo);

// role routes
router.get("/create-role", checkIsLoggedIn, checkMinimumPermissions(102), checkIsWebAdmin, createRole);
router.get("/roles", checkIsLoggedIn, checkMinimumPermissions(102), getAllRoles);
router.get("/delete-role", checkIsLoggedIn, checkMinimumPermissions(102), checkIsWebAdmin, deleteRole);
router.post("/add-role-to-user", checkIsLoggedIn, checkMinimumPermissions(102), checkIsAdmin, addRoleToUser);

export default router;
