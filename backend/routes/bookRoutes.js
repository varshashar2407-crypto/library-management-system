import express from "express";
import {
  addBook,
  getBooks,
  getBookById,
  updateBook,
  deleteBook,
  getMyEbooks,
  selectEbook,
  deselectEbook
} from "../controllers/bookController.js";
import { protect, adminOnly } from "../middleware/auth.js";
import Book from "../models/Book.js";
import IssuedBook from "../models/IssuedBook.js";

const router = express.Router();

const FINE_PER_DAY = 5;
const REISSUE_LIMIT = 2;
const ISSUE_DAYS = 14;

// GET /api/books — only books from user's active memberships
router.get("/", protect, getBooks);

// GET /api/books/my-issued
router.get("/my-issued", protect, async (req, res) => {
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

// GET /api/books/my-ebooks
router.get("/my-ebooks", protect, getMyEbooks);

// GET /api/books/library/:libraryId
router.get("/library/:libraryId", async (req, res) => {
  try {
    const books = await Book.find({
      library: req.params.libraryId
    });

    res.json(books);
  } catch (error) {
    console.error("Get library books error:", error);
    res.status(500).json({
      message: "Could not load books for this library."
    });
  }
});

// POST /api/books/:bookId/ebook/select
router.post("/:bookId/ebook/select", protect, selectEbook);

// POST /api/books/:bookId/ebook/deselect
router.post("/:bookId/ebook/deselect", protect, deselectEbook);

// POST /api/books/:bookId/issue
router.post("/:bookId/issue", protect, async (req, res) => {
  try {
    const book = await Book.findOne({
      _id: req.params.bookId,
      availableCopies: { $gt: 0 }
    });

    if (!book) {
      return res.status(404).json({
        message: "Book is not available."
      });
    }

    const alreadyIssued = await IssuedBook.findOne({
      user: req.user._id,
      book: req.params.bookId,
      status: "issued"
    });

    if (alreadyIssued) {
      return res.status(400).json({
        message: "You have already issued this book. Please return it first."
      });
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + ISSUE_DAYS);

    const issuedBook = await IssuedBook.create({
      user: req.user._id,
      book: req.params.bookId,
      library: book.library,
      status: "issued",
      issueDate: new Date(),
      dueDate,
      reissueCount: 0,
      fine: 0
    });

    await Book.findByIdAndUpdate(req.params.bookId, {
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

// POST /api/books/issued-books/:id/return
router.post("/issued-books/:id/return", protect, async (req, res) => {
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

// PUT /api/books/issued-books/:id/reissue
router.put("/issued-books/:id/reissue", protect, async (req, res) => {
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

// GET /api/books/:id
router.get("/:id", getBookById);

// POST /api/books
router.post("/", protect, adminOnly, addBook);

// PUT /api/books/:id
router.put("/:id", protect, adminOnly, updateBook);

// DELETE /api/books/:id
router.delete("/:id", protect, adminOnly, deleteBook);

export default router;