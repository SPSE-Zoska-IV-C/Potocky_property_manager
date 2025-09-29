import { Router } from "express";
import {
  createListing,
  getListings,
  getListingById,
  updateListing,
  deleteListing,
} from "../controllers/listingController";

const router = Router();

router.get("/", getListings);
router.post("/", createListing);
router.get("/:id", getListingById);
router.put("/:id", updateListing);
router.delete("/:id", deleteListing);

export default router;
