import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    planName: {
      type: String,
      required: true,
      enum: [
        "Monthly Premium",
        "Annual Premium",
        "Basic Reader",
        "Standard Reader",
        "Premium Reader",
        "Basic",
        "Student Premium",
        "Premium"
      ]
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    durationDays: {
      type: Number,
      required: true,
      min: 1
    },

    startDate: {
      type: Date,
      default: Date.now
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator(value) {
          return !this.startDate || value > this.startDate;
        },
        message: "End date must be after start date."
      }
    },

    status: {
      type: String,
      enum: ["Active", "Expired", "Cancelled"],
      default: "Active"
    },

    paymentMode: {
      type: String,
      enum: ["Demo", "Online"],
      default: "Demo"
    },

    paymentStatus: {
      type: String,
      enum: [
        "Demo",
        "Pending",
        "Success",
        "Failed",
        "Refunded"
      ],
      default: "Demo"
    },

    transactionId: {
      type: String,
      default: null
    },

    termsAcceptedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

subscriptionSchema.index({
  user: 1,
  status: 1,
  endDate: -1
});

subscriptionSchema.index({
  status: 1,
  endDate: 1
});

export default mongoose.model(
  "Subscription",
  subscriptionSchema
);import Subscription from "../models/Subscription.js";

const PLANS = {
  monthly: {
    planName: "Monthly Premium",
    price: 199,
    durationDays: 30
  },
  annual: {
    planName: "Annual Premium",
    price: 1999,
    durationDays: 365
  }
};

const DEMO_ENABLED =
  process.env.ENABLE_DEMO_SUBSCRIPTIONS === "true";

// GET /api/subscriptions/my
export const getMySubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: "Active",
      endDate: { $gt: new Date() },
      paymentStatus: "Demo"
    }).sort({ createdAt: -1 });

    res.json({ subscription });
  } catch (error) {
    console.error("Get active subscription error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/subscriptions/history
export const getSubscriptionHistory = async (req, res) => {
  try {
    const subscriptions = await Subscription.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    res.json({ subscriptions });
  } catch (error) {
    console.error("Get subscription history error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/subscriptions/activate
export const activateSubscription = async (req, res) => {
  try {
    const { planId, acceptedTerms } = req.body;

    if (!DEMO_ENABLED) {
      return res.status(403).json({
        message:
          "Demo subscription activation is disabled on this server."
      });
    }

    if (!acceptedTerms) {
      return res.status(400).json({
        message: "You must accept the membership terms."
      });
    }

    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({
        message: "Selected membership plan is not available."
      });
    }

    const now = new Date();
    const endDate = new Date(
      now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
    );

    const existingActive = await Subscription.findOne({
      user: req.user._id,
      status: "Active",
      endDate: { $gt: now },
      paymentStatus: { $in: ["Demo", "Success"] }
    });

    if (existingActive) {
      return res.status(409).json({
        message: "You already have an active Premium membership."
      });
    }

    const subscription = await Subscription.create({
      user: req.user._id,
      planName: plan.planName,
      price: plan.price,
      durationDays: plan.durationDays,
      startDate: now,
      endDate,
      status: "Active",
      paymentMode: "Demo",
      paymentStatus: "Demo",
      transactionId: null,
      termsAcceptedAt: now
    });

    res.status(201).json({
      message: `${plan.planName} activated successfully.`,
      subscription
    });
  } catch (error) {
    console.error("Activate subscription error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message:
          Object.values(error.errors)[0]?.message ||
          "Invalid subscription data."
      });
    }

    res.status(500).json({ message: "Server error" });
  }
};