import express from "express";
import {
  getProfile,
  loginUser,
  registerUser,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  googleLogin,
  getSlotAvailability,
  cancelPayment,
} from "../controllers/userController.js";
import authUser from "../middlewares/authUser.js";
import upload from "../middlewares/multer.js";

const userRouter = express.Router();

// Auth routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/google-login", googleLogin);

// Protected routes
userRouter.get("/profile", authUser, getProfile);
userRouter.put(
  "/update-profile",
  authUser,
  upload.single("image"),
  updateProfile
);

// Appointment routes
userRouter.post("/book-appointment", authUser, bookAppointment);
userRouter.get("/appointments", authUser, listAppointment);
userRouter.post("/cancel-appointment", authUser, cancelAppointment);
userRouter.get("/slot-availability/:docId/:slotDate", getSlotAvailability);

// Payment routes
userRouter.post("/payment-razorpay", authUser, paymentRazorpay);
userRouter.post("/verify-razorpay", authUser, verifyRazorpay);
userRouter.post("/cancel-payment", authUser, cancelPayment);

export default userRouter;
