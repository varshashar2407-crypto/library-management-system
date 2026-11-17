import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token =
      authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        message: "Please login first."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found."
      });
    }

    req.user = user;
    next();
  } catch (error) {
  console.error("Auth middleware failed:", {
    name: error.name,
    message: error.message
  });

  return res.status(401).json({
    message: "Invalid or expired token."
  });
}
};

export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      message: "Admin access only."
    });
  }
  next();
};