import express from "express";
import Subscription from "../models/Subscription.js";
import { protect, adminOnly } from "../middleware/auth.js";
const router = express.Router();
// @route   GET /api/subscriptions/my
// @desc    Get logged-in user's current subscription
// @access  Private
router.get("/my", protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: "Active"
    }).sort({ endDate: -1 });

    res.status(200).json({
      subscription: subscription || null
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not load subscription."
    });
  }
});

// @route   POST /api/subscriptions/activate
// @desc    Activate demo membership
// @access  Private
router.post("/activate", protect, async (req, res) => {
  try {
    const { planId, acceptedTerms } = req.body;

    if (!acceptedTerms) {
      return res.status(400).json({
        message: "Please accept the Terms and Conditions."
      });
    }

    const planConfig = {
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

    const plan = planConfig[planId];

    if (!plan) {
      return res.status(400).json({
        message: "Invalid membership plan."
      });
    }

    const existingSubscription = await Subscription.findOne({
      user: req.user._id,
      status: "Active"
    });

    if (existingSubscription) {
      return res.status(409).json({
        message: "You already have an active membership.",
        subscription: existingSubscription
      });
    }

    const startDate = new Date();
    const endDate = new Date(
      startDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000
    );

    const subscription = await Subscription.create({
      user: req.user._id,
      planName: plan.planName,
      price: plan.price,
      durationDays: plan.durationDays,
      startDate,
      endDate,
      paymentMode: "Demo",
      paymentStatus: "Demo",
      transactionId: `DEMO-${Date.now()}`,
      termsAcceptedAt: startDate,
      status: "Active"
    });

    res.status(201).json({
      message: "Demo membership activated successfully.",
      subscription
    });
  } catch (error) {
    console.error("Subscription activation error:", error);
    res.status(500).json({
      message: "Membership could not be activated."
    });
  }
});
// @route   GET /api/subscriptions
// @desc    Get subscriptions for logged-in user
// @access  Private
router.get("/", protect, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(
      Math.max(parseInt(req.query.limit || "10", 10), 1),
      100
    );
    const skip = (page - 1) * limit;

    const filter = { user: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.planName) {
      filter.planName = req.query.planName;
    }

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user", "name email"),
      Subscription.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: subscriptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscriptions."
    });
  }
});

// @route   GET /api/subscriptions/current
// @desc    Get current active subscription
// @access  Private
router.get("/current", protect, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      user: req.user._id,
      status: "Active"
    })
      .sort({ endDate: -1 })
      .populate("user", "name email");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "No active subscription found."
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch current subscription."
    });
  }
});

// @route   GET /api/subscriptions/:id
// @desc    Get subscription by ID
// @access  Private
router.get("/:id", protect, async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate("user", "name email");

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found."
      });
    }

    if (
      subscription.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this subscription."
      });
    }

    res.status(200).json({
      success: true,
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription."
    });
  }
});

// @route   POST /api/subscriptions
// @desc    Create subscription
// @access  Private
router.post("/", protect, async (req, res) => {
  try {
    const {
      planName,
      price,
      durationDays,
      startDate,
      endDate,
      paymentMode,
      paymentStatus,
      transactionId,
      termsAcceptedAt
    } = req.body;

    if (!planName || !price || !durationDays || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Plan, price, duration, and end date are required."
      });
    }

    const existingSubscription = await Subscription.findOne({
      user: req.user._id,
      status: "Active"
    });

    if (existingSubscription) {
      return res.status(409).json({
        success: false,
        message: "User already has an active subscription.",
        data: existingSubscription
      });
    }

    const subscription = await Subscription.create({
      user: req.user._id,
      planName,
      price,
      durationDays,
      startDate: startDate || new Date(),
      endDate,
      paymentMode,
      paymentStatus,
      transactionId,
      termsAcceptedAt,
      status: "Active"
    });

    res.status(201).json({
      success: true,
      message: "Subscription created successfully.",
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create subscription."
    });
  }
});

// @route   PUT /api/subscriptions/:id
// @desc    Update subscription
// @access  Private
router.put("/:id", protect, async (req, res) => {
  try {
    const allowedFields = [
      "planName",
      "price",
      "durationDays",
      "startDate",
      "endDate",
      "status",
      "paymentMode",
      "paymentStatus",
      "transactionId",
      "termsAcceptedAt"
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    const filter = { _id: req.params.id };

    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }

    const updatedSubscription = await Subscription.findOneAndUpdate(
      filter,
      updates,
      {
        new: true,
        runValidators: true
      }
    ).populate("user", "name email");

    if (!updatedSubscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found or not authorized."
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully.",
      data: updatedSubscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update subscription."
    });
  }
});

// @route   PATCH /api/subscriptions/:id/cancel
// @desc    Cancel subscription
// @access  Private
router.patch("/:id/cancel", protect, async (req, res) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }

    const subscription = await Subscription.findOne(filter);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found or not authorized."
      });
    }

    if (subscription.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Subscription is already cancelled."
      });
    }

    subscription.status = "Cancelled";
    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription cancelled successfully.",
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to cancel subscription."
    });
  }
});

// @route   PATCH /api/subscriptions/:id/renew
// @desc    Renew subscription
// @access  Private
router.patch("/:id/renew", protect, async (req, res) => {
  try {
    const filter = { _id: req.params.id };

    if (req.user.role !== "admin") {
      filter.user = req.user._id;
    }

    const subscription = await Subscription.findOne(filter);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found or not authorized."
      });
    }

    const durationInDays = Number(req.body.durationInDays || 30);

    if (!Number.isFinite(durationInDays) || durationInDays <= 0) {
      return res.status(400).json({
        success: false,
        message: "durationInDays must be a positive number."
      });
    }

    const currentEndDate =
      subscription.endDate && subscription.endDate > new Date()
        ? new Date(subscription.endDate)
        : new Date();

    subscription.endDate = new Date(
      currentEndDate.getTime() + durationInDays * 24 * 60 * 60 * 1000
    );

    subscription.status = "Active";

    await subscription.save();

    res.status(200).json({
      success: true,
      message: "Subscription renewed successfully.",
      data: subscription
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to renew subscription."
    });
  }
});

// @route   DELETE /api/subscriptions/:id
// @desc    Delete subscription
// @access  Admin
router.delete("/:id", protect, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can delete subscriptions."
      });
    }

    const subscription = await Subscription.findByIdAndDelete(
      req.params.id
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found."
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete subscription."
    });
  }
});

export default router;