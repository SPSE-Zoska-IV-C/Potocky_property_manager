import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";
import { db } from "../drizzle/db";
import { UsersTable } from "../users/schema";
import { eq } from "drizzle-orm";
import { handleError } from "../shared/http";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-04-30.basil",
});

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const userId = res.locals.userId;
    if (!userId) return handleError(res, "Unauthorized", 401, "Unauthorized");

    // fetch user to get email
    const user = await db.query.usersTable.findFirst({
      where: eq(UsersTable.id, userId),
    });
    if (!user)
      return handleError(res, "User not found", 404, "U,ser not found");

    // create session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Premium Membership (1 month)",
              description: "Unlock all premium features for one month",
            },
            unit_amount: 990, // 9.90 EUR in cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        userId: user.id,
      },
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/premium-success`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/dashboard/settings`,
    });
    return res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error", err);
    return handleError(res, err, 500, "Failed to create Stripe session");
  }
};

export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  _: NextFunction
) => {
  const sig = req.headers["stripe-signature"] as string;
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      // Stripe needs the raw body for verification
      (req as any).rawBody || req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Webhook signature error", err);
    return handleError(res, err, 400, `Webhook Error: ${err}`);
  }

  // handle checkout session completed
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    console.log("Webhook received, processing payment for user:", userId);

    if (userId) {
      try {
        // update user premium status for 1 month
        await db
          .update(UsersTable)
          .set({
            isPremium: true,
            premiumEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month
          })
          .where(eq(UsersTable.id, userId));
        console.log("Premium status updated for user:", userId);
      } catch (err) {
        console.error("DB update error", err);
        return handleError(
          res,
          err,
          500,
          "Failed to update user premium status"
        );
      }
    }
  }
  res.json({ received: true });
};
