import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library",
      required: true
    },

    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active"
    },

    joinedAt: {
      type: Date,
      default: Date.now
    },

    cancelledAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Sirf active memberships unique hongi
membershipSchema.index(
  { user: 1, library: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" }
  }
);

membershipSchema.index({ user: 1, status: 1 });
membershipSchema.index({ library: 1, status: 1 });

export default mongoose.model("Membership", membershipSchema);