router.post("/issued-books/:id/return", protect, async (req, res) => {
  try {
    const session = await mongoose.startSession();

    try {
      const result = await session.withTransaction(async () => {
        const issuedBook = await IssuedBook.findOne(
          {
            _id: req.params.id,
            user: req.user._id,
            status: "issued"
          },
          null,
          { session }
        );

        if (!issuedBook) {
          return null;
        }

        const today = new Date();
        let fine = 0;

        if (today > issuedBook.dueDate) {
          const lateDays = Math.ceil(
            (today - issuedBook.dueDate) / (1000 * 60 * 60 * 24)
          );

          fine = lateDays * 5;
        }

        issuedBook.returnedDate = today;
        issuedBook.fine = fine;
        issuedBook.status = "returned";

        await issuedBook.save({ session });

        await Book.findByIdAndUpdate(
          issuedBook.book,
          { $inc: { availableCopies: 1 } },
          { session }
        );

        return fine;
      });

      if (result === null) {
        return res.status(404).json({
          message: "Issued book not found or already returned."
        });
      }

      res.json({
        message:
          result > 0
            ? `Book returned successfully. Fine: Rs ${result}`
            : "Book returned successfully.",
        fine: result
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    res.status(500).json({
      message: "Could not return this book."
    });
  }
});