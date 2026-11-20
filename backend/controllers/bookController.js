import Membership from "../models/Membership.js";
import Book from "../models/Book.js";
import IssuedBook from "../models/IssuedBook.js";
import Library from "../models/Library.js";

const FINE_PER_DAY = 10;
const ISSUE_DAYS = 14;
const REISSUE_LIMIT = 2;

// ==================== BOOK CRUD ====================

export const addBook = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "author",
      "category",
      "library",
      "totalCopies",
      "availableCopies"
    ];

    const data = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        data[field] = req.body[field];
      }
    }

    if (!data.title || !data.author || !data.library) {
      return res.status(400).json({
        message: "Title, author, and library are required."
      });
    }

    if (!data.totalCopies) data.totalCopies = 1;
    if (!data.availableCopies) data.availableCopies = data.totalCopies;

    const book = await Book.create(data);

    res.status(201).json(book);
  } catch (error) {
    res.status(500).json({
      message: "Could not add book."
    });
  }
};

export const getBooks = async (req, res) => {
  try {
    const memberships = await Membership.find({
      user: req.user._id,
      status: "active",
    });

    const joinedLibraryIds = memberships.map(
      (membership) => membership.library
    );

    if (joinedLibraryIds.length === 0) {
      return res.json([]);
    }

    const filter = {
      library: { $in: joinedLibraryIds },
    };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(
        req.query.search,
        "i"
      );

      filter.$or = [
        { title: searchRegex },
        { author: searchRegex },
      ];
    }

   const books = await Book.find(filter)
  .sort({ createdAt: -1 })
  .populate("library", "name address area city pincode");
   
    res.json(books);
  } catch (error) {
    console.error("Get books error:", error);

    res.status(500).json({
      message: "Could not load books.",
    });
  }
};

export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("library", "name address city");

    if (!book) {
      return res.status(404).json({
        message: "Book not found."
      });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({
      message: "Could not load book."
    });
  }
};

export const updateBook = async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "author",
      "category",
      "totalCopies",
      "availableCopies"
    ];

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!book) {
      return res.status(404).json({
        message: "Book not found."
      });
    }

    res.json(book);
  } catch (error) {
    res.status(500).json({
      message: "Could not update book."
    });
  }
};

export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        message: "Book not found."
      });
    }

    res.json({
      message: "Book deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete book."
    });
  }
};

// ==================== EBOOKS ====================

export const getMyEbooks = async (req, res) => {
  try {
    const memberships = await Membership.find({
      user: req.user._id,
      status: "active",
    });

    const joinedLibraryIds = memberships.map(
      (membership) => membership.library
    );

    if (joinedLibraryIds.length === 0) {
      return res.json([]);
    }

    const books = await Book.find({
      selectedBy: req.user._id,
      library: { $in: joinedLibraryIds },
    }).populate("library", "name city");

    res.json(books);
  } catch (error) {
    console.error("Get my ebooks error:", error);

    res.status(500).json({
      message: "Could not load selected ebooks.",
    });
  }
};

export const selectEbook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.bookId,
      { $addToSet: { selectedBy: req.user._id } },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({
        message: "Book not found."
      });
    }

    res.json({
      message: "Ebook selected successfully.",
      book
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not select ebook."
    });
  }
};

export const deselectEbook = async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.bookId,
      { $pull: { selectedBy: req.user._id } },
      { new: true }
    );

    if (!book) {
      return res.status(404).json({
        message: "Book not found."
      });
    }

    res.json({
      message: "Ebook deselected successfully.",
      book
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not deselect ebook."
    });
  }
};

// ==================== BOOK ISSUES ====================

export const issueBook = async (req, res) => {
  try {
    const { libraryId } = req.body;

    if (!libraryId) {
      return res.status(400).json({
        message: "Library ID is required.",
      });
    }

    const book = await Book.findOne({
      _id: req.params.bookId,
      library: libraryId,
      availableCopies: { $gt: 0 },
    });

    if (!book) {
      return res.status(404).json({
        message: "Book is not available in this library.",
      });
    }

    const alreadyIssued = await IssuedBook.findOne({
      user: req.user._id,
      book: book._id,
      library: libraryId,
      status: "issued",
    });

    if (alreadyIssued) {
      return res.status(400).json({
        message: "You have already issued this book.",
      });
    }

    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + ISSUE_DAYS);

    const issue = await IssuedBook.create({
      user: req.user._id,
      book: book._id,
      library: libraryId,
      status: "issued",
      issueDate,
      dueDate,
      reissueCount: 0,
      fine: 0,
    });

    book.availableCopies -= 1;
    await book.save();

    res.status(201).json({
      message: "Book issued successfully.",
      issuedBook: issue,
    });
  } catch (error) {
    console.error("Issue book error:", error);

    res.status(500).json({
      message: "Could not issue this book.",
    });
  }
};

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

    if ((issue.reissueCount || 0) >= REISSUE_LIMIT) {
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

// ==================== LIBRARIES ====================

const LIBRARY_FIELDS = [
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

const pickLibraryFields = (body) => {
  const data = {};
  for (const field of LIBRARY_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
};

export const addLibrary = async (req, res) => {
  try {
    const data = pickLibraryFields(req.body);

    if (!data.name || !data.address || !data.city || !data.pincode) {
      return res.status(400).json({
        message: "Name, address, city, and pincode are required."
      });
    }

    const library = await Library.create(data);

    res.status(201).json(library);
  } catch (error) {
    res.status(500).json({
      message: "Could not create library."
    });
  }
};

export const getLibraries = async (req, res) => {
  try {
    const libraries = await Library.find().sort({ name: 1 });

    res.json(libraries);
  } catch (error) {
    res.status(500).json({
      message: "Could not load libraries."
    });
  }
};

export const getNearbyLibraries = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

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
          $maxDistance: Number(radius)
        }
      }
    });

    res.json(libraries);
  } catch (error) {
    res.status(500).json({
      message: "Could not load nearby libraries."
    });
  }
};

export const getLibraryById = async (req, res) => {
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
};

export const updateLibrary = async (req, res) => {
  try {
    const updates = pickLibraryFields(req.body);

    const library = await Library.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
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
};

export const deleteLibrary = async (req, res) => {
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
};