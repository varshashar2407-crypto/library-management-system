import Library from "../models/Library.js";

// ==================== HELPERS ====================

const LIBRARY_FIELDS = [
  "name",
  "address",
  "area",
  "city",
  "pincode",
  "contact",
  "email",
  "description",
  "location",
  "googlePlaceId",
  "photos",
  "nearbyMetroStations",
  "nearbyLandmarks",
  "openingTime",
  "closingTime",
  "facilities"
];

const pickAllowedFields = (body) => {
  const data = {};
  for (const field of LIBRARY_FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
};

// ==================== CRUD ====================

// @desc    Add a library
export const addLibrary = async (req, res) => {
  try {
    const data = pickAllowedFields(req.body);

    if (!data.name || !data.address || !data.city || !data.pincode) {
      return res.status(400).json({
        message: "Name, address, city, and pincode are required."
      });
    }

    const library = await Library.create(data);

    res.status(201).json(library);
  } catch (error) {
    res.status(500).json({
      message: "Could not create library."
    });
  }
};

// @desc    Get all libraries
export const getLibraries = async (req, res) => {
  try {
    const libraries = await Library.find().sort({ name: 1 });

    res.json(libraries);
  } catch (error) {
    res.status(500).json({
      message: "Could not load libraries."
    });
  }
};

// @desc    Get nearby libraries
export const getNearbyLibraries = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude are required."
      });
    }

    const libraries = await Library.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)]
          },
          distanceField: "distanceMeters",
          maxDistance: Number(radius),
          spherical: true,
          distanceMultiplier: 0.001
        }
      },
      {
        $addFields: {
          distanceKm: "$distanceMeters"
        }
      },
      {
        $sort: { distanceMeters: 1 }
      }
    ]);

    res.json(libraries);
  } catch (error) {
    res.status(500).json({
      message: "Could not load nearby libraries."
    });
  }
};

// @desc    Get library by ID
export const getLibraryById = async (req, res) => {
  try {
    const library = await Library.findById(req.params.id);

    if (!library) {
      return res.status(404).json({
        message: "Library not found."
      });
    }

    res.json(library);
  } catch (error) {
    res.status(500).json({
      message: "Could not load library."
    });
  }
};

// @desc    Update library
export const updateLibrary = async (req, res) => {
  try {
    const updates = pickAllowedFields(req.body);

    const library = await Library.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!library) {
      return res.status(404).json({
        message: "Library not found."
      });
    }

    res.json(library);
  } catch (error) {
    res.status(500).json({
      message: "Could not update library."
    });
  }
};

// @desc    Delete library
export const deleteLibrary = async (req, res) => {
  try {
    const library = await Library.findByIdAndDelete(req.params.id);

    if (!library) {
      return res.status(404).json({
        message: "Library not found."
      });
    }

    res.json({
      message: "Library deleted successfully."
    });
  } catch (error) {
    res.status(500).json({
      message: "Could not delete library."
    });
  }
};