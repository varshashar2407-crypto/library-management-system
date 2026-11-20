import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";
import Library from "./models/Library.js";
import connectDB from "./config/db.js";

const ADMIN_EMAIL = "varshashar2407@gmail.com";

const checkAdminLibrary = async () => {
  await connectDB();

  const admin = await User.findOne({
    email: ADMIN_EMAIL.toLowerCase(),
    role: "admin"
  });

  if (!admin) {
    console.log("ADMIN NOT FOUND");
    await mongoose.connection.close();
    return;
  }

  const library = await Library.findOne({
    admin: admin._id
  });

  console.log({
    adminId: admin._id,
    adminName: admin.name,
    adminEmail: admin.email,
    adminRole: admin.role,
    adminLibrary: admin.library,
    linkedLibrary: library
      ? {
          id: library._id,
          name: library.name
        }
      : null
  });

  await mongoose.connection.close();
};

checkAdminLibrary();