import express from "express";
import { protect, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import Book from "../models/Book.js";
import IssuedBook from "../models/IssuedBook.js";
import Library from "../models/Library.js";

const router = express.Router();

// Admin stats
router.get("/stats", protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBooks = await Book.countDocuments();
    const totalLibraries = await Library.countDocuments();
    const totalIssued = await IssuedBook.countDocuments({ status: "issued" });
    const totalReturned = await IssuedBook.countDocuments({ status: "returned" });

    res.json({
      totalUsers,
      totalBooks,
      totalLibraries,
      totalIssued,
      totalReturned,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// All users
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// All issued books
router.get("/issued", protect, adminOnly, async (req, res) => {
  try {
    const issued = await IssuedBook.find()
      .populate("user", "name email")
      .populate("book", "title author")
      .populate("library", "name");
    res.json(issued);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;