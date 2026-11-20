import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    author: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      trim: true,
      default: "",
    },

    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      required: true,
    },

    totalCopies: {
      type: Number,
      default: 1,
      min: [0, "Total copies cannot be negative."],
      validate: {
        validator: Number.isInteger,
        message: "Total copies must be a whole number.",
      },
    },

    availableCopies: {
      type: Number,
      default: 1,
      min: [0, "Available copies cannot be negative."],
      validate: {
        validator: Number.isInteger,
        message: "Available copies must be a whole number.",
      },
    },

    isEbook: {
      type: Boolean,
      default: false,
    },

    ebookUrl: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

bookSchema.index({ library: 1, title: 1 });
bookSchema.index({ library: 1, category: 1 });

export default mongoose.model("Book", bookSchema);