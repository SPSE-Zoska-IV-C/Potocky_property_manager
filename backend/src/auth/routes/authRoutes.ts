import { Router } from "express";
import { login, logout, register } from "../controllers/authController";
import { changePassword } from "../controllers/changePasswordController";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.post("/changePassword", changePassword);
router.all("/logout", logout);

export default router;
