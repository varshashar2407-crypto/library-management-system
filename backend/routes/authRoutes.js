import express from "express";
import {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  adminRegister
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.post("/admin-register", adminRegister);

export default router;