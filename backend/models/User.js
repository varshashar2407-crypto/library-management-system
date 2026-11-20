import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      minlength: [2, "Name must be at least 2 characters."],
      maxlength: [50, "Name cannot exceed 50 characters."]
    },

    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\S+@\S+\.\S+$/,
        "Please provide a valid email address."
      ]
    },

    phone: {
      type: String,
      required: [true, "Phone number is required."],
      trim: true
    },

    password: {
      type: String,
      required: [true, "Password is required."],
      minlength: [8, "Password must be at least 8 characters."],
      select: false
    },

    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member"
    },

    library: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Library"
    },

    area: {
      type: String,
      required: [true, "Area is required."],
      trim: true
    },

    city: {
      type: String,
      required: [true, "City is required."],
      trim: true
    },

    pincode: {
      type: String,
      required: [true, "Pincode is required."],
      trim: true
    },

    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

userSchema.index({ city: 1, area: 1 });

export default mongoose.model("User", userSchema);