import mongoose from "mongoose";

const issuedBookSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true
    },

    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      required: true
    },

    status: {
      type: String,
      enum: ["requested", "issued", "returned"],
      default: "requested"
    },

    issueDate: {
      type: Date,
      default: Date.now
    },

    dueDate: {
      type: Date,
      validate: {
        validator(value) {
          return !this.issueDate || value > this.issueDate;
        },
        message: "Due date must be after issue date."
      }
    },

    returnedDate: {
      type: Date
    },

    reissueCount: {
      type: Number,
      default: 0,
      min: 0
    },

    fine: {
      type: Number,
      default: 0,
      min: 0
    },

    adminRemark: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

issuedBookSchema.index({ user: 1, status: 1 });
issuedBookSchema.index({ book: 1, library: 1, status: 1 });
issuedBookSchema.index({ status: 1, dueDate: 1 });

export default mongoose.model("IssuedBook", issuedBookSchema);