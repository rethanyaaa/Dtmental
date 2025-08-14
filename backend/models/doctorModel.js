import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, required: true },
    video: { type: String, required: true }, // New field for video URL
    speciality: { type: String, required: true },
    degree: { type: String, required: true },
    experience: { type: String, required: true },
    about: { type: String, required: true },
    available: { type: Boolean, default: true },
    fees: { type: Number, required: true },
    address: { type: Object, required: true },
    date: { type: Number, required: true },
    slots_booked: { type: Object, default: {} },
  },
  { minimize: false }
);

// Add comprehensive indexes for better query performance
// Note: email already has unique index from schema definition
doctorSchema.index({ speciality: 1 }); // For filtering by speciality
doctorSchema.index({ available: 1 }); // For filtering available doctors
doctorSchema.index({ date: -1 }); // For sorting by registration date
doctorSchema.index({ fees: 1 }); // For sorting by fees
doctorSchema.index({ experience: 1 }); // For experience-based queries
doctorSchema.index({ name: 1 }); // For name-based searches

// Compound indexes for common query patterns
doctorSchema.index({ speciality: 1, available: 1 }); // For available doctors by speciality
doctorSchema.index({ speciality: 1, fees: 1 }); // For doctors by speciality and fees
doctorSchema.index({ available: 1, date: -1 }); // For available doctors sorted by registration
doctorSchema.index({ speciality: 1, experience: 1 }); // For doctors by speciality and experience
doctorSchema.index({ available: 1, fees: 1 }); // For available doctors sorted by fees

// Text index for search functionality
doctorSchema.index({
  name: "text",
  speciality: "text",
  degree: "text",
  about: "text",
});

const doctorModel =
  mongoose.models.doctor || mongoose.model("doctor", doctorSchema);

export default doctorModel;
