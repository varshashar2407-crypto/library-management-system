import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Library from "../models/Library.js";


const normalizeEmail = (email) => email.trim().toLowerCase();


const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });


const getUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  area: user.area,
  city: user.city,
  pincode: user.pincode,
  isVerified: user.isVerified,
  library: user.library
});

const getValidationMessage = (error) =>
  Object.values(error.errors)
    .map((item) => item.message)
    .join(" ");


// ==================== REGISTER ====================


export const register = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      area,
      city,
      pincode,
    } = req.body;


    const requiredFields = [
      name,
      email,
      phone,
      password,
      area,
      city,
      pincode,
    ];


    if (
      requiredFields.some(
        (value) =>
          typeof value !== "string" || !value.trim()
      )
    ) {
      return res.status(400).json({
        message: "All required fields must be filled.",
      });
    }


    const normalizedEmail = normalizeEmail(email);


    const existing = await User.findOne({
      email: normalizedEmail,
    });


    if (existing) {
      return res.status(409).json({
        message: "Email already registered.",
      });
    }


    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      area: area.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
    });


    const token = generateToken(user._id);


    return res.status(201).json({
      message: "Registration successful.",
      token,
      user: getUserResponse(user),
    });
  } catch (error) {
    console.error("Register error:", error);


    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with these details already exists.",
      });
    }


    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: getValidationMessage(error) || "Invalid data.",
      });
    }


    return res.status(500).json({
      message: "Registration failed. Please try again.",
    });
  }
};


// ==================== VERIFY OTP ====================


export const verifyOtp = async (req, res) => {
  return res.status(200).json({
    message: "OTP verification is not required.",
  });
};


// ==================== LOGIN ====================


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;


    if (
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }


    const normalizedEmail = normalizeEmail(email);


    const user = await User.findOne({
      email: normalizedEmail,
    }).select("+password");


    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }


    const isMatch = await bcrypt.compare(
      password,
      user.password
    );


    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }


    const token = generateToken(user._id);


    return res.json({
      message: "Login successful.",
      token,
      user: getUserResponse(user),
    });
  } catch (error) {
    console.error("Login error:", error);


    return res.status(500).json({
      message: "Login failed. Please try again.",
    });
  }
};


// ==================== ADMIN REGISTER ====================


export const adminRegister = async (req, res) => {

  let createdAdminId = null;

  try {
    const {
      name,
      email,
      phone,
      password,
      libraryName,
      address,
      area,
      state,
      city,
      pincode,
    } = req.body;


    const requiredFields = [
      name,
      email,
      phone,
      password,
      libraryName,
      address,
      area,
      state,
      city,
      pincode,
    ];


    if (
      requiredFields.some(
        (value) =>
          typeof value !== "string" || !value.trim()
      )
    ) {
      return res.status(400).json({
        message:
          "Name, email, phone, password, library name, address, area, state, city and pincode are required.",
      });
    }


    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters.",
      });
    }


    if (!/^\d{10}$/.test(phone.trim())) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit phone number.",
      });
    }


    if (!/^\d{6}$/.test(pincode.trim())) {
      return res.status(400).json({
        message: "Please enter a valid 6-digit pincode.",
      });
    }


    const normalizedEmail = normalizeEmail(email);


    const existingUser = await User.findOne({
      email: normalizedEmail,
    });


    if (existingUser) {
      return res.status(409).json({
        message:
          "Email already registered. If you already created an admin account, use Admin Login.",
      });
    }


    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }


    const hashedPassword = await bcrypt.hash(password, 10);


    const admin = new User({
      name: name.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      password: hashedPassword,
      role: "admin",
      area: area.trim(),
      city: city.trim(),
      pincode: pincode.trim(),
    });


   const library = new Library({
  name: libraryName.trim(),
  address: address.trim(),
  area: area.trim(),
  state: state.trim(),
  city: city.trim(),
  pincode: pincode.trim(),
  admin: admin._id
});

// IMPORTANT: Admin ko apni library link do
admin.library = library._id;


    // Validate both documents before saving either one.
    await admin.validate();

    console.log("LIBRARY_BEFORE_VALIDATE:", {
      name: library.name,
      address: library.address,
      area: library.area,
      state: library.state,
      city: library.city,
      pincode: library.pincode,
      admin: library.admin,
    });

    await library.validate();


    // Generate the token before database writes.
    const token = generateToken(admin._id);


    await admin.save();
    createdAdminId = admin._id;


    await library.save();


    return res.status(201).json({
      message: "Admin and library created successfully.",
      token,
      user: getUserResponse(admin),
      adminId: admin._id,
      libraryId: library._id,
    });
  } catch (error) {
    console.error("ADMIN_REGISTER_CATCH:", {
      name: error.name,
      code: error.code,
      message: error.message,
      validationErrors: error.errors,
      keyValue: error.keyValue,
      stack: error.stack,
    });


    if (createdAdminId) {
      console.error(
        "Admin registration partially completed. Review this admin record:",
        createdAdminId.toString()
      );


      return res.status(500).json({
        message:
          "Admin account was created, but library setup could not be completed. Do not register again. Please check the backend logs before continuing.",
      });
    }


    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "A record with these details already exists. Please check the existing account.",
      });
    }


    if (error.name === "ValidationError") {
      return res.status(400).json({
        message:
          getValidationMessage(error) ||
          "Please check the registration details.",
      });
    }


    return res.status(500).json({
      message:
        "Admin registration failed. Please check the backend terminal.",
    });
  }
};


// ==================== FORGOT / RESET ====================


export const forgotPassword = async (req, res) => {
  return res.status(501).json({
    message: "Password reset is not available yet.",
  });
};


export const resetPassword = async (req, res) => {
  return res.status(501).json({
    message: "Password reset is not available yet.",
  });
};


// ==================== PROFILE ====================


export const getProfile = async (req, res) => {
  return res.json(req.user);
};


export const updateProfile = async (req, res) => {
  try {
    const fields = [
      "name",
      "phone",
      "area",
      "city",
      "pincode",
    ];


    const updates = {};


    for (const field of fields) {
      if (typeof req.body[field] !== "string") {
        return res.status(400).json({
          message: "Please fill all profile fields.",
        });
      }


      updates[field] = req.body[field].trim();


      if (!updates[field]) {
        return res.status(400).json({
          message: "All profile fields are required.",
        });
      }
    }


    if (!/^\d{10}$/.test(updates.phone)) {
      return res.status(400).json({
        message: "Please enter a valid 10-digit phone number.",
      });
    }


    if (!/^\d{6}$/.test(updates.pincode)) {
      return res.status(400).json({
        message: "Please enter a valid 6-digit pincode.",
      });
    }


    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );


    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found.",
      });
    }


    return res.json({
      message: "Profile updated successfully.",
      user: getUserResponse(updatedUser),
    });
  } catch (error) {
    console.error("Profile update error:", error);


    return res
      .status(
        error.name === "ValidationError" ||
          error.code === 11000
          ? 400
          : 500
      )
      .json({
        message:
          "Could not update profile. Please check your details.",
      });
  }
};