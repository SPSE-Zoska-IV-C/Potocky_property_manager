import { Request, Response } from "express";
import { db } from "../../drizzle/db";
import { PropertyTable } from "../schema";
import { eq } from "drizzle-orm";
import { handleError } from "../../shared/http";
// Property Listing Controller
// Placeholder in-memory storage
let listings: any[] = [];

export const createListing = (req: Request, res: Response) => {
  const listing = {
    ...req.body,
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  listings.push(listing);
  res.status(201).json(listing);
};

export const getListings = async (req: Request, res: Response) => {
  // Fetch all not rented properties from the DB
  try {
    const properties = await db
      .select()
      .from(PropertyTable)
      .where(eq(PropertyTable.isRented, false));
    // Map to Listing type expected by frontend
    const mapped = properties.map((p: any) => ({
      id: p.propertyId,
      title: p.name,
      description: "", // No description in property schema
      price: p.pricePerDay, // Use pricePerDay for filtering
      address: p.address,
      images: [],
      propertyType: "", // Not in schema
      features: [], // Not in schema
      status: p.isRented ? "inactive" : "active",
      ownerId: p.createdBy,
      createdAt: p.dateCreated,
      updatedAt: p.lastDateRented,
      size: p.size,
      rooms: p.rooms,
      isRented: p.isRented,
    }));
    res.json(mapped);
  } catch (error) {
    return handleError(res, error, 500, "Failed to fetch listings");
  }
};

export const getListingById = (req: Request, res: Response) => {
  const listing = listings.find((l) => l.id === req.params.id);
  if (!listing) return res.status(404).json({ error: "Not found" });
  res.json(listing);
};

export const updateListing = (req: Request, res: Response) => {
  const idx = listings.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  listings[idx] = { ...listings[idx], ...req.body, updatedAt: new Date() };
  res.json(listings[idx]);
};

export const deleteListing = (req: Request, res: Response) => {
  const idx = listings.findIndex((l) => l.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  const removed = listings.splice(idx, 1);
  res.json(removed[0]);
};
