import express from "express";
import Membership from "../models/Membership.js";
import Library from "../models/Library.js";
import IssuedBook from "../models/IssuedBook.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /api/memberships/my
// @desc    Get logged-in user's memberships
// @access  Private
router.get("/my", protect, async (req, res) => {
  try {
    const memberships = await Membership.find({
      user: req.user._id
    })
      .sort({ createdAt: -1 })
      .populate("library", "name address city pincode");

    res.json(memberships);
  } catch (error) {
    res.status(500).json({
      message: "Memberships could not be loaded."
    });
  }
});

// @route   POST /api/memberships/join/:libraryId
// @desc    Join a library
// @access  Private
router.post("/join/:libraryId", protect, async (req, res) => {
  try {
    const library = await Library.findById(req.params.libraryId);

    if (!library) {
      return res.status(404).json({
        message: "Library not found."
      });
    }

    let membership = await Membership.findOne({
      user: req.user._id,
      library: library._id
    });

    if (membership && membership.status === "active") {
      return res.status(400).json({
        message: "You have already joined this library."
      });
    }

    if (membership) {
      membership.status = "active";
      membership.cancelledAt = undefined;
      membership.joinedAt = new Date();

      await membership.save();
    } else {
      membership = await Membership.create({
        user: req.user._id,
        library: library._id
      });
    }

    const populatedMembership = await Membership.findById(
      membership._id
    ).populate("library", "name address city pincode");

    res.status(201).json({
      message: "Library joined successfully.",
      membership: populatedMembership
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "You have already joined this library."
      });
    }

    res.status(500).json({
      message: "Could not join this library."
    });
  }
});

// @route   DELETE /api/memberships/leave/:libraryId
// @desc    Leave a library (membership optional)
// @access  Private
router.delete("/leave/:libraryId", protect, async (req, res) => {
  try {
    const membership = await Membership.findOne({
      user: req.user._id,
      library: req.params.libraryId
    });

    if (membership) {
      membership.status = "cancelled";
      membership.cancelledAt = new Date();
      await membership.save();
    }

    res.json({
      message: "Library left successfully."
    });
  } catch (error) {
    console.error("Leave library error:", error);
    res.status(500).json({
      message: "Could not leave this library."
    });
  }
});

export default router;