import Book from "../models/Book.js";
import IssuedBook from "../models/IssuedBook.js";

const FINE_PER_DAY = 10;
const ISSUE_DAYS = 14;

// @desc    Issue a book
export const issueBook = async (req, res) => {
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

    const issue = await IssuedBook.create({
      user: req.user._id,
      book: bookId,
      library: libraryId,
      status: "issued",
      issueDate: new Date(),
      dueDate,
      reissueCount: 0,
      fine: 0
    });

    await Book.findByIdAndUpdate(
      bookId,
      { $inc: { availableCopies: -1 } }
    );

    res.status(201).json(issue);
  } catch (error) {
      console.error("Issue book error:", error);
    res.status(500).json({
      message: "Could not issue this book."
    });
  }
};

// @desc    Get my issued books
export const getMyIssues = async (req, res) => {
  try {
    const issues = await IssuedBook.find({
      user: req.user._id
    })
      .sort({ createdAt: -1 })
      .populate("book", "title author category coverImage")
      .populate("library", "name address city");

    res.json(issues);
  } catch (error) {
    res.status(500).json({
      message: "Issued books could not be loaded."
    });
  }
};

// @desc    Return a book
export const returnBook = async (req, res) => {
  try {
    const issue = await IssuedBook.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "issued"
    });

    if (!issue) {
      return res.status(404).json({
        message: "Issued book not found or already returned."
      });
    }

    const returnDate = new Date();
    let fine = 0;

    if (returnDate > issue.dueDate) {
      const daysLate = Math.ceil(
        (returnDate - issue.dueDate) / (1000 * 60 * 60 * 24)
      );

      fine = daysLate * FINE_PER_DAY;
    }

    issue.returnedDate = returnDate;
    issue.fine = fine;
    issue.status = "returned";

    await issue.save();

    await Book.findByIdAndUpdate(
      issue.book,
      { $inc: { availableCopies: 1 } }
    );

    res.json(issue);
  } catch (error) {
    res.status(500).json({
      message: "Could not return this book."
    });
  }
};

// @desc    Reissue a book
export const reissueBook = async (req, res) => {
  try {
    const issue = await IssuedBook.findOne({
      _id: req.params.id,
      user: req.user._id,
      status: "issued"
    });

    if (!issue) {
      return res.status(404).json({
        message: "Issued book not found or already returned."
      });
    }

    if ((issue.reissueCount || 0) >= 2) {
      return res.status(400).json({
        message: "Reissue limit reached."
      });
    }

    const dueDate = new Date(issue.dueDate);
    dueDate.setDate(dueDate.getDate() + ISSUE_DAYS);

    issue.dueDate = dueDate;
    issue.reissueCount = (issue.reissueCount || 0) + 1;

    await issue.save();

    res.json(issue);
  } catch (error) {
    res.status(500).json({
      message: "Could not reissue this book."
    });
  }
};