import { Router } from "express";
import { createCheckoutSession, handleStripeWebhook } from "./paymentController";
import { checkIsLoggedIn } from "../middlewares/checkIsLoggedIn";

const router = Router();

router.post("/create-checkout-session", checkIsLoggedIn, createCheckoutSession);
router.post("/webhook", handleStripeWebhook); // Stripe webhook: no auth

export default router;
