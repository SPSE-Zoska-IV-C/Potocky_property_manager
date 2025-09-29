import { Router } from "express";
import { checkIsWebAdmin } from "../../middlewares/checkIsWebAdmin";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
} from "../controllers/adminController";

const router = Router();

// apply checkIsWebAdmin middleware to all admin routes
router.use(checkIsWebAdmin);

// user management routes
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
