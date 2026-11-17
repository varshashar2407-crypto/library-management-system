import mongoose from "mongoose";
import dotenv from "dotenv";
import Library from "./models/Library.js";
import Book from "./models/Book.js";

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    console.log(`Database: ${mongoose.connection.name}`);

    const centralLibrary = await Library.create({
      name: "Central City Library",
      address: "MG Road, Near Metro Station",
      area: "Civil Lines",
      city: "Ghaziabad",
      pincode: "201002",
      contact: "9876543210",
      email: "central@library.com",
      description: "Main city library with reading room and ebook access.",
      location: {
        type: "Point",
        coordinates: [77.4538, 28.6692]
      },
      openingTime: "09:00 AM",
      closingTime: "08:00 PM",
      facilities: ["Reading Room", "WiFi", "E-Books"],
      totalBooks: 12,
      availableBooks: 12
    });

    const greenParkLibrary = await Library.create({
      name: "Green Park Reading Library",
      address: "Park Street, Sector 4",
      area: "Green Park",
      city: "Ghaziabad",
      pincode: "201002",
      contact: "9876500000",
      email: "greenpark@library.com",
      description: "Community library with kids section.",
      location: {
        type: "Point",
        coordinates: [77.4475, 28.6725]
      },
      openingTime: "10:00 AM",
      closingTime: "07:00 PM",
      facilities: ["Reading Room", "Kids Section"],
      totalBooks: 5,
      availableBooks: 5
    });

    await Book.insertMany([
      {
        title: "The Alchemist",
        author: "Paulo Coelho",
        category: "Fiction",
        library: centralLibrary._id,
        totalCopies: 5,
        availableCopies: 5
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        category: "Self Help",
        library: centralLibrary._id,
        totalCopies: 4,
        availableCopies: 4
      },
      {
        title: "Wings of Fire",
        author: "A.P.J. Abdul Kalam",
        category: "Biography",
        library: centralLibrary._id,
        totalCopies: 3,
        availableCopies: 3
      },
      {
        title: "Rich Dad Poor Dad",
        author: "Robert Kiyosaki",
        category: "Finance",
        library: greenParkLibrary._id,
        totalCopies: 3,
        availableCopies: 3
      },
      {
        title: "Ikigai",
        author: "Héctor García",
        category: "Self Help",
        library: greenParkLibrary._id,
        totalCopies: 2,
        availableCopies: 2
      }
    ]);

    console.log("2 libraries and 5 books added successfully");
  } catch (error) {
    console.error("Adding data failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

seed();