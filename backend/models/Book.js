import mongoose from "mongoose";

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    author: {
      type: String,
      required: true,
      trim: true
    },

    category: {
      type: String,
      trim: true,
      default: ""
    },

    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      required: true
    },

    totalCopies: {
      type: Number,
      default: 1,
      min: [0, "Total copies cannot be negative."]
    },

    availableCopies: {
      type: Number,
      default: 1,
      min: [0, "Available copies cannot be negative."]
    }
  },
  {
    timestamps: true
  }
);

bookSchema.index({ library: 1, title: 1 });
bookSchema.index({ library: 1, category: 1 });

export default mongoose.model("Book", bookSchema);