import express from "express";
import mongoose from "mongoose";
import { protect, adminOnly } from "../middleware/auth.js";
import User from "../models/User.js";
import Book from "../models/Book.js";
import Library from "../models/Library.js";
import Membership from "../models/Membership.js";
import IssuedBook from "../models/IssuedBook.js";


const router = express.Router();


const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);


router.use(protect, adminOnly);


router.use(
  asyncRoute(async (req, res, next) => {
    const libraries = await Library.find({
      admin: req.user._id,
    })
      .select(
        "_id name address area city pincode contact email description openingTime closingTime totalBooks availableBooks photos facilities"
      )
      .limit(2);


    if (libraries.length === 0) {
      return res.status(404).json({
        message: "Your admin account is not linked to a library.",
      });
    }


    if (libraries.length > 1) {
      return res.status(409).json({
        message:
          "Multiple libraries are linked to this admin. Review the assignments.",
      });
    }


    req.adminLibrary = libraries[0];
    next();
  })
);


const getBookInput = (body) => {
  const title =
    typeof body.title === "string" ? body.title.trim() : "";
  const author =
    typeof body.author === "string" ? body.author.trim() : "";
  const category =
    typeof body.category === "string" ? body.category.trim() : "";
  const isEbook = body.isEbook === true;
  const ebookUrl =
    typeof body.ebookUrl === "string" ? body.ebookUrl.trim() : "";


  if (!title || !author) {
    const error = new Error("Book title and author are required.");
    error.status = 400;
    throw error;
  }


  if (isEbook) {
    let validUrl = false;


    try {
      const url = new URL(ebookUrl);
      validUrl =
        url.protocol === "https:" &&
        !url.username &&
        !url.password;
    } catch {
      validUrl = false;
    }


    if (!validUrl) {
      const error = new Error(
        "Enter a valid HTTPS ebook link without embedded credentials."
      );
      error.status = 400;
      throw error;
    }
  }


  return {
    title,
    author,
    category,
    isEbook,
    ebookUrl: isEbook ? ebookUrl : "",
  };
};


const checkBookId = (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.bookId)) {
    return res.status(400).json({
      message: "Invalid book ID.",
    });
  }


  next();
};


// Catalogue for this admin's library.
router.get(
  "/library-books",
  asyncRoute(async (req, res) => {
    const books = await Book.find({
      library: req.adminLibrary._id,
    })
      .populate("library", "name")
      .sort({ createdAt: -1 });


    res.json({
      library: req.adminLibrary,
      books,
    });
  })
);


// Library overview and statistics.
router.get(
  "/stats",
  asyncRoute(async (req, res) => {
    const library = await Library.findById(req.adminLibrary._id);


    if (!library) {
      return res.status(404).json({
        message: "Library not found.",
      });
    }


    const filter = { library: library._id };


    const [memberIds, totalBooks, totalIssued, totalReturned] =
      await Promise.all([
        Membership.distinct("user", {
          ...filter,
          status: "active",
        }),
        Book.countDocuments(filter),
        IssuedBook.countDocuments({
          ...filter,
          status: "issued",
        }),
        IssuedBook.countDocuments({
          ...filter,
          status: "returned",
        }),
      ]);


    const totalUsers = await User.countDocuments({
      _id: { $in: memberIds },
    });


    res.json({
      library: {
        _id: library._id,
        name: library.name,
        address: library.address,
        area: library.area,
        city: library.city,
        pincode: library.pincode,
        contact: library.contact,
        email: library.email,
        description: library.description,
        openingTime: library.openingTime,
        closingTime: library.closingTime,
        totalBooks: library.totalBooks,
        availableBooks: library.availableBooks,
        photos: library.photos || [],
        facilities: library.facilities || [],
      },
      totalUsers,
      totalBooks,
      totalLibraries: 1,
      totalIssued,
      totalReturned,
      totalImages: (library.photos || []).length,
    });
  })
);


// Add a physical book or ebook.
router.post(
  "/books",
  asyncRoute(async (req, res) => {
    const input = getBookInput(req.body);


    const rawCopies = req.body.totalCopies;
    const totalCopies = input.isEbook ? 0 : Number(rawCopies);


    if (
      !input.isEbook &&
      (
        rawCopies === "" ||
        rawCopies === null ||
        rawCopies === undefined ||
        !Number.isInteger(totalCopies) ||
        totalCopies < 1
      )
    ) {
      return res.status(400).json({
        message: "Enter at least 1 whole physical copy.",
      });
    }


    const book = await Book.create({
      ...input,
      library: req.adminLibrary._id,
      totalCopies,
      availableCopies: totalCopies,
    });


    res.status(201).json({
      message: input.isEbook
        ? "Ebook added successfully."
        : "Book added successfully.",
      book,
    });
  })
);


// Edit metadata. Copy counts are intentionally not edited here.
router.patch(
  "/books/:bookId",
  checkBookId,
  asyncRoute(async (req, res) => {
    const input = getBookInput(req.body);


    const book = await Book.findOne({
      _id: req.params.bookId,
      library: req.adminLibrary._id,
    });


    if (!book) {
      return res.status(404).json({
        message: "Book not found in your library.",
      });
    }


    if (Boolean(book.isEbook) !== input.isEbook) {
      return res.status(400).json({
        message:
          "Changing physical/ebook type is not supported. Add a separate entry.",
      });
    }


    const updated = await Book.findOneAndUpdate(
      {
        _id: book._id,
        library: req.adminLibrary._id,
      },
      { $set: input },
      { new: true, runValidators: true }
    );


    if (!updated) {
      return res.status(404).json({
        message: "Book is no longer available.",
      });
    }


    res.json({
      message: "Book details updated.",
      book: updated,
    });
  })
);


// Keep issue history intact: referenced books cannot be deleted.
router.delete(
  "/books/:bookId",
  checkBookId,
  asyncRoute(async (req, res) => {
    const book = await Book.findOne({
      _id: req.params.bookId,
      library: req.adminLibrary._id,
    });


    if (!book) {
      return res.status(404).json({
        message: "Book not found in your library.",
      });
    }


    const hasHistory = await IssuedBook.exists({
      book: book._id,
    });


    if (hasHistory) {
      return res.status(409).json({
        message:
          "This book has issue history and cannot be permanently deleted.",
      });
    }


    const hasUnavailableCopies =
      book.totalCopies !== book.availableCopies;


    if (hasUnavailableCopies) {
      return res.status(409).json({
        message:
          "Copy counts are not balanced. Review this book before deleting.",
      });
    }


    const result = await Book.deleteOne({
      _id: book._id,
      library: req.adminLibrary._id,
      totalCopies: book.totalCopies,
      availableCopies: book.availableCopies,
    });


    if (!result.deletedCount) {
      return res.status(409).json({
        message: "Book inventory changed. Refresh and try again.",
      });
    }


    res.json({ message: "Book deleted successfully." });
  })
);


// Active members of this library only.
router.get(
  "/users",
  asyncRoute(async (req, res) => {
    const memberIds = await Membership.distinct("user", {
      library: req.adminLibrary._id,
      status: "active",
    });


    const users = await User.find({
      _id: { $in: memberIds },
    })
      .select("_id name email phone area city pincode")
      .sort({ name: 1 });


    res.json(users);
  })
);


// Includes issued and returned history.
router.get(
  "/issued",
  asyncRoute(async (req, res) => {
    const records = await IssuedBook.find({
      library: req.adminLibrary._id,
    })
      .populate("user", "name email")
      .populate("book", "title author")
      .populate("library", "name")
      .sort({ createdAt: -1 });


    res.json(records);
  })
);


router.use((error, req, res, next) => {
  console.error("Admin route error:", error);


  if (error.code === 11000) {
    return res.status(409).json({
      message: "A record with these details already exists.",
    });
  }


  const status =
    error.status ||
    (["ValidationError", "CastError"].includes(error.name)
      ? 400
      : 500);


  res.status(status).json({
    message:
      status === 500
        ? "Admin operation failed. Check the backend terminal."
        : error.message,
  });
});


export default router;