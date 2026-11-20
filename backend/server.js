import "dotenv/config";
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import adminRoutes from "./routes/adminRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";
import bookRoutes from "./routes/bookRoutes.js";
import membershipRoutes from "./routes/membershipRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import subscriptionRoutes from "./routes/SubscriptionRoutes.js";

const app = express();

// CORS — specific origin, credentials support
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json());

// Health check
app.get("/", (req, res) => {
  res.json({ message: "LibriFolio API is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/libraries", libraryRoutes);
app.use("/api/books", bookRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/admin", adminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.message);
  res.status(500).json({
    message: "Something went wrong."
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();