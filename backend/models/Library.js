import mongoose from "mongoose";

const photoSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true
    },

    caption: {
      type: String,
      trim: true,
      default: ""
    },

    type: {
      type: String,
      enum: ["exterior", "interior", "reading_room", "other"],
      default: "other"
    }
  },
  { _id: false }
);

const nearbyPlaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    placeId: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true
    },

    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator(value) {
          return (
            Array.isArray(value) &&
            value.length === 2 &&
            Number.isFinite(value[0]) &&
            Number.isFinite(value[1]) &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90
          );
        },
        message:
          "Location must contain valid [longitude, latitude] coordinates."
      }
    }
  },
  { _id: false }
);

const librarySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    address: {
      type: String,
      required: true,
      trim: true
    },

    area: {
      type: String,
      required: true,
      trim: true
    },

    city: {
      type: String,
      required: true,
      trim: true
    },

    pincode: {
      type: String,
      required: true,
      trim: true
    },

    contact: {
      type: String,
      trim: true,
      default: ""
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },

    description: {
      type: String,
      trim: true,
      default: ""
    },

    location: {
      type: locationSchema
    },

    googlePlaceId: {
      type: String,
      trim: true,
      default: ""
    },

    photos: {
      type: [photoSchema],
      default: []
    },

    nearbyMetroStations: {
      type: [nearbyPlaceSchema],
      default: []
    },

    nearbyLandmarks: {
      type: [nearbyPlaceSchema],
      default: []
    },

    totalBooks: {
      type: Number,
      default: 0,
      min: 0
    },

    availableBooks: {
      type: Number,
      default: 0,
      min: 0
    },

    openingTime: {
      type: String,
      default: "09:00 AM"
    },

    closingTime: {
      type: String,
      default: "08:00 PM"
    },
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true 
    },

    facilities: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true
  }
);

librarySchema.index({ location: "2dsphere" });
librarySchema.index({ city: 1, area: 1 });
librarySchema.index({ name: "text", address: "text" });

export default mongoose.model("Library", librarySchema);