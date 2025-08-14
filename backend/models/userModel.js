import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false }, // Made optional for Google OAuth
  image: { type: String },
  address: { type: Object, default: { line1: "", line2: "" } },
  gender: { type: String, default: "Not Selected" },
  dob: { type: String, default: "Not Selected" },
  phone: { type: String, default: "0000000000" },
  joinedDate: { type: Date, default: Date.now },
  // Google OAuth fields
  googleId: { type: String, unique: true, sparse: true },
  isGoogleUser: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  // Mood Tracking Preferences
  moodTracking: {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ["daily", "twice_daily", "weekly", "custom"],
      default: "daily",
    },
    reminderTimes: [
      {
        type: String,
        default: ["09:00"], // Default morning reminder
      },
    ],
    aiAnalysisConsent: { type: Boolean, default: false },
    aiAnalysisLevel: {
      type: String,
      enum: ["basic", "detailed", "comprehensive"],
      default: "basic",
    },
    privacySettings: {
      shareWithTherapist: { type: Boolean, default: false },
      shareWithFamily: { type: Boolean, default: false },
      anonymousDataSharing: { type: Boolean, default: false },
    },
    notificationPreferences: {
      moodReminders: { type: Boolean, default: true },
      weeklyInsights: { type: Boolean, default: true },
      crisisAlerts: { type: Boolean, default: true },
      therapistNotifications: { type: Boolean, default: false },
    },
  },
});

// Add indexes for better query performance
// Note: email and googleId already have unique indexes from schema definition
userSchema.index({ joinedDate: -1 }); // For sorting by join date (newest first)
userSchema.index({ "moodTracking.enabled": 1 }); // For filtering users with mood tracking
userSchema.index({ "moodTracking.aiAnalysisConsent": 1 }); // For AI analysis consent queries
userSchema.index({ emailVerified: 1 }); // For email verification status queries
userSchema.index({ isGoogleUser: 1 }); // For distinguishing Google vs regular users
userSchema.index({ phone: 1 }); // For phone number lookups
userSchema.index({ name: 1 }); // For name-based searches

// Compound indexes for common query patterns
userSchema.index({ email: 1, isGoogleUser: 1 }); // For login queries
userSchema.index({
  "moodTracking.enabled": 1,
  "moodTracking.aiAnalysisConsent": 1,
}); // For mood tracking analytics
userSchema.index({ joinedDate: -1, "moodTracking.enabled": 1 }); // For user analytics

const userModel = mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
