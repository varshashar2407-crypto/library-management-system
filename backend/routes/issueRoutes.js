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

// GET /api/issues/requests
// Admin pending issue requests dekhega
router.get("/requests", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only library admins can view requests."
      });
    }

    const requests = await IssuedBook.find({
      library: req.user.library,
      status: "requested"
    })
      .sort({ createdAt: -1 })
      .populate("user", "name email")
      .populate("book", "title author category")
      .populate("library", "name");

    res.json(requests);
  } catch (error) {
    console.error("Get issue requests error:", error);
    res.status(500).json({
      message: "Issue requests could not be loaded."
    });
  }
});

// POST /api/issues
// User issue request bhejta hai. Admin approval ke baad book issue hogi.
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

    const existingRequest = await IssuedBook.findOne({
      user: req.user._id,
      book: bookId,
      library: libraryId,
      status: { $in: ["requested", "issued"] }
    });

    if (existingRequest) {
      return res.status(400).json({
        message:
          existingRequest.status === "requested"
            ? "Your issue request is already pending."
            : "You have already issued this book."
      });
    }

    const issueRequest = await IssuedBook.create({
      user: req.user._id,
      book: bookId,
      library: libraryId,
      status: "requested",
      issueDate: new Date(),
      reissueCount: 0,
      fine: 0
    });

    const populatedRequest = await IssuedBook.findById(
      issueRequest._id
    )
      .populate("book", "title author category coverImage")
      .populate("library", "name address city");

    res.status(201).json({
      message: "Issue request sent to library admin.",
      issue: populatedRequest
    });
  } catch (error) {
    console.error("Create issue request error:", error);
    res.status(500).json({
      message: "Could not send issue request."
    });
  }
});

// PATCH /api/issues/:id/approve
router.patch("/:id/approve", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only library admins can approve requests."
      });
    }

    const issueRequest = await IssuedBook.findOne({
      _id: req.params.id,
      library: req.user.library,
      status: "requested"
    }).populate("book");

    if (!issueRequest) {
      return res.status(404).json({
        message: "Issue request not found or already processed."
      });
    }

    const book = await Book.findById(issueRequest.book._id);

    if (!book || book.availableCopies <= 0) {
      issueRequest.status = "returned";
      issueRequest.adminRemark = "Book is no longer available.";
      await issueRequest.save();

      return res.status(400).json({
        message: "This book is no longer available."
      });
    }

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + ISSUE_DAYS);

    issueRequest.status = "issued";
    issueRequest.issueDate = issueDate;
    issueRequest.dueDate = dueDate;

    await issueRequest.save();

    await Book.findByIdAndUpdate(book._id, {
      $inc: { availableCopies: -1 }
    });

    const populatedIssue = await IssuedBook.findById(
      issueRequest._id
    )
      .populate("book", "title author category coverImage")
      .populate("library", "name address city");

    res.json({
      message: "Issue request approved successfully.",
      issue: populatedIssue
    });
  } catch (error) {
    console.error("Approve issue request error:", error);
    res.status(500).json({
      message: "Could not approve this request."
    });
  }
});

// PATCH /api/issues/:id/reject
router.patch("/:id/reject", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        message: "Only library admins can reject requests."
      });
    }

    const issueRequest = await IssuedBook.findOne({
      _id: req.params.id,
      library: req.user.library,
      status: "requested"
    });

    if (!issueRequest) {
      return res.status(404).json({
        message: "Issue request not found or already processed."
      });
    }

    issueRequest.status = "returned";
    issueRequest.adminRemark =
      req.body?.adminRemark || "Request rejected by admin.";

    await issueRequest.save();

    res.json({
      message: "Issue request rejected successfully.",
      issue: issueRequest
    });
  } catch (error) {
    console.error("Reject issue request error:", error);
    res.status(500).json({
      message: "Could not reject this request."
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