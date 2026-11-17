import express from "express";
import Library from "../models/Library.js";
import { protect, adminOnly } from "../middleware/auth.js";
const router = express.Router();

// @route   GET /api/libraries
// @desc    Get all libraries
// @access  Public
router.get("/", async (req, res) => {
  try {
    const libraries = await Library.find()
      .sort({ name: 1 });

    res.json(libraries);
  } catch (error) {
    res.status(500).json({
      message: "Could not load libraries."
    });
  }
});

// @route   GET /api/libraries/nearby
// @desc    Get nearby libraries using lat/lng
// @access  Public
router.get("/nearby", async (req, res) => {
  try {
    const { lat, lng, maxDistance = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude are required."
      });
    }

    const libraries = await Library.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: Number(maxDistance)
        }
      }
    });

    res.json(libraries);
  } catch (error) {
    res.status(500).json({
      message: "Could not load nearby libraries."
    });
  }
});

// @route   GET /api/libraries/:id
// @desc    Get one library
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const library = await Library.findById(req.params.id);

    if (!library) {
      return res.status(404).json({
        message: "Library not found."
      });
    }

    res.json(library);
  } catch (error) {
    res.status(500).json({
      message: "Could not load library."
    });
  }
});

// @route   POST /api/libraries
// @desc    Create a library
// @access  Admin
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const {
      name,
      address,
      area,
      city,
      pincode,
      contact,
      email,
      description,
      location,
      googlePlaceId,
      photos,
      nearbyMetroStations,
      nearbyLandmarks,
      openingTime,
      closingTime,
      facilities
    } = req.body;

    if (!name || !address || !area || !city || !pincode) {
      return res.status(400).json({
        message: "Name, address, area, city, and pincode are required."
      });
    }

    const library = await Library.create({
      name,
      address,
      area,
      city,
      pincode,
      contact,
      email,
      description,
      location,
      googlePlaceId,
      photos,
      nearbyMetroStations,
      nearbyLandmarks,
      openingTime,
      closingTime,
      facilities
    });

    res.status(201).json(library);
  } catch (error) {
    res.status(500).json({
      message: "Could not create library."
    });
  }
});

// @route   PUT /api/libraries/:id
// @desc    Update a library
// @access  Admin
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "address",
      "area",
      "city",
      "pincode",
      "contact",
      "email",
      "description",
      "location",
      "googlePlaceId",
      "photos",
      "nearbyMetroStations",
      "nearbyLandmarks",
      "openingTime",
      "closingTime",
      "facilities"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const library = await Library.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!library) {
      return res.status(404).json({
        message: "Library not found."
      });
    }

    res.json(library);
  } catch (error) {
    res.status(500).json({
      message: "Could not update library."
    });
  }
});

// @route   DELETE /api/libraries/:id
// @desc    Delete a library
// @access  Admin
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const library = await Library.findByIdAndDelete(req.params.id);

    if (!library) {
      return res.status(404).json({
        message: "Library not found."
      });
    }

    res.json({
      message: "Library deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete library."
    });
  }
});

export default router;