import express from "express";
import IssuedBook from "../models/IssuedBook.js";
import Book from "../models/Book.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const FINE_PER_DAY = 5;
const REISSUE_LIMIT = 2;
const ISSUE_DAYS = 14;

// GET /api/issues/my
router.get("/my", protect, async (req, res) => {
  try {
    const issuedBooks = await IssuedBook.find({
      user: req.user._id
    })
      .sort({ createdAt: -1 })
      .populate("book", "title author category coverImage")
      .populate("library", "name address city");

    res.json(issuedBooks);
  } catch (error) {
    console.error("Get issued books error:", error);
    res.status(500).json({
      message: "Issued books could not be loaded."
    });
  }
});

// POST /api/issues
router.post("/", protect, async (req, res) => {
  try {
    const { bookId, libraryId } = req.body;

    if (!bookId || !libraryId) {
      return res.status(400).json({
        message: "Book ID and library ID are required."
      });
    }

    const book = await Book.findOne({
      _id: bookId,
      library: libraryId,
      availableCopies: { $gt: 0 }
    });

    if (!book) {
      return res.status(404).json({
        message: "Book is not available in this library."
      });
    }

    const alreadyIssued = await IssuedBook.findOne({
      user: req.user._id,
      book: bookId,
      library: libraryId,
      status: "issued"
    });

    if (alreadyIssued) {
      return res.status(400).json({
        message: "You have already issued this book."
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + ISSUE_DAYS);

    const issuedBook = await IssuedBook.create({
      user: req.user._id,
      book: bookId,
      library: libraryId,
      status: "issued",
      issueDate: new Date(),
      dueDate,
      reissueCount: 0,
      fine: 0
    });

    await Book.findByIdAndUpdate(bookId, {
      $inc: { availableCopies: -1 }
    });

    const populatedIssue = await IssuedBook.findById(issuedBook._id)
      .populate("book", "title author category coverImage")
      .populate("library", "name address city");

    res.status(201).json({
      message: "Book issued successfully.",
      issue: populatedIssue
    });
  } catch (error) {
    console.error("Issue book error:", error);
    res.status(500).json({
      message: "Could not issue this book."
    });
  }
});

// POST /api/issues/:id/return
router.post("/:id/return", protect, async (req, res) => {
  try {
    const issuedBook = await IssuedBook.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "issued"
    });

    if (!issuedBook) {
      return res.status(404).json({
        message: "Issued book not found or already returned."
      });
    }

    const today = new Date();
    let fine = 0;

    if (today > issuedBook.dueDate) {
      const lateDays = Math.ceil(
        (today - issuedBook.dueDate) / (1000 * 60 * 60 * 24)
      );

      fine = lateDays * FINE_PER_DAY;
    }

    issuedBook.returnedDate = today;
    issuedBook.fine = fine;
    issuedBook.status = "returned";

    await issuedBook.save();

    await Book.findByIdAndUpdate(issuedBook.book, {
      $inc: { availableCopies: 1 }
    });

    res.json({
      message:
        fine > 0
          ? `Book returned successfully. Fine: Rs ${fine}`
          : "Book returned successfully.",
      fine
    });
  } catch (error) {
    console.error("Return book error:", error);
    res.status(500).json({
      message: "Could not return this book."
    });
  }
});

// PUT /api/issues/:id/reissue
router.put("/:id/reissue", protect, async (req, res) => {
  try {
    const issuedBook = await IssuedBook.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "issued"
    });

    if (!issuedBook) {
      return res.status(404).json({
        message: "Issued book not found or already returned."
      });
    }

    if ((issuedBook.reissueCount || 0) >= REISSUE_LIMIT) {
      return res.status(400).json({
        message: "Reissue limit reached."
      });
    }

    const dueDate = new Date(issuedBook.dueDate);
    dueDate.setDate(dueDate.getDate() + ISSUE_DAYS);

    issuedBook.dueDate = dueDate;
    issuedBook.reissueCount = (issuedBook.reissueCount || 0) + 1;

    await issuedBook.save();

    res.json({
      message: "Book reissued successfully.",
      issue: issuedBook
    });
  } catch (error) {
    console.error("Reissue book error:", error);
    res.status(500).json({
      message: "Could not reissue this book."
    });
  }
});

export default router;