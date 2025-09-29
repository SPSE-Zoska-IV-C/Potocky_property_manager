import authRouter from "../auth/routes/authRoutes";
import propertyRoutes from "../properties/routes/propertyRoutes";
import groupRoutes from "../properties/routes/groupRoutes";
import userRoutes from "../users/routes/userRoutes";
import guestRoutes from "../properties/routes/guestRoutes";
import stayRoutes from "../properties/routes/stayRoutes";
import cleaningRoutes from "../properties/routes/cleaningRoutes";
import adminRoutes from "../admin/routes/adminRoutes";
import paymentRoutes from "../payment/paymentRoutes";
import listingRoutes from "../properties/routes/listingRoutes";

export const routes = {
  auth: authRouter,
  properties: propertyRoutes,
  groups: groupRoutes,
  users: userRoutes,
  guests: guestRoutes,
  stays: stayRoutes,
  cleaning: cleaningRoutes,
  admin: adminRoutes,
  payment: paymentRoutes,
  listings: listingRoutes,
};
