import validator from "validator";
import bcrypt from "bcrypt";
import userModel from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import tempReservationModel from "../models/tempReservationModel.js";
import razorpay from "razorpay";
import { OAuth2Client } from "google-auth-library";

// Google OAuth client
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// api to register a new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Details..." });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered! Login instead.",
      });
    }

    //   validating email format
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a Valid Email !!" });
    }

    //   validating strong password
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be Strong!",
      });
    }

    // hashing user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
    };

    const newUser = new userModel(userData);
    const user = await newUser.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.status(201).json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Registration failed! Try again.",
    });
  }
};

// api to login a user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Details..." });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Enter a Valid Email." });
    }

    // find user by email in database
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Account not found! Try Again.",
      });
    }

    // compare user password with saved password in database
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Incorrect Credentials! Try again.",
      });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Login failed! Try again.",
    });
  }
};

// api to login with Google OAuth
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res
        .status(400)
        .json({ success: false, message: "Google token is required" });
    }

    // Verify the Google ID token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture, email_verified } = payload;

    // Check if user already exists
    let user = await userModel.findOne({ googleId });

    if (!user) {
      // Check if user exists with email but not Google OAuth
      user = await userModel.findOne({ email });

      if (user) {
        // Update existing user to include Google OAuth info
        user.googleId = googleId;
        user.isGoogleUser = true;
        user.emailVerified = email_verified;
        if (picture) user.image = picture;
        await user.save();
      } else {
        // Create new user
        user = new userModel({
          name,
          email,
          googleId,
          isGoogleUser: true,
          emailVerified: email_verified,
          image: picture || "",
        });
        await user.save();
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.status(200).json({ success: true, token });
  } catch (error) {
    console.log("Google login error:", error);
    res.status(500).json({
      success: false,
      message: "Google login failed! Try again.",
    });
  }
};

// api to get user profile data
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const userData = await userModel.findById(userId).select("-password");
    res.status(201).json({ success: true, userData });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

//  Api to update User profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, dob, gender } = req.body;
    const imageFile = req.file;

    if (!name || !phone || !dob || !gender) {
      return res
        .status(400)
        .json({ success: false, message: "Missing Details..." });
    }

    await userModel.findByIdAndUpdate(userId, {
      name,
      phone,
      address: JSON.parse(address),
      dob,
      gender,
    });

    if (imageFile) {
      // upload image to cloudinary
      const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
        resource_type: "image",
      });
      const imageUrl = imageUpload.secure_url;

      await userModel.findByIdAndUpdate(userId, { image: imageUrl });
    }

    res.status(201).json({ success: true, message: "Profile Updated 🎉" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// API to book appointment
const bookAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      docId,
      slotDate,
      slotTime,
      reasonForVisit,
      sessionType,
      communicationMethod,
      briefNotes,
      emergencyContact,
      consentGiven,
    } = req.body;

    // Validate required fields
    if (!reasonForVisit || !sessionType || !consentGiven) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all required fields!" });
    }

    // Validate session type and communication method
    if (sessionType === "Online" && !communicationMethod) {
      return res.status(400).json({
        success: false,
        message: "Please select communication method for online sessions!",
      });
    }

    const docData = await doctorModel.findById(docId).select("-password");

    if (!docData.available) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor Not Available!" });
    }

    let slots_booked = docData.slots_booked;

    // Check if slot is already booked
    if (slots_booked[slotDate]) {
      if (slots_booked[slotDate].includes(slotTime)) {
        return res
          .status(400)
          .json({ success: false, message: "Slot Not Available!" });
      }
    }

    // Check if there are any temporary reservations for this slot
    const existingTempReservation = await tempReservationModel.findOne({
      docId,
      slotDate,
      slotTime,
      expiresAt: { $gt: new Date() }, // Not expired
    });

    if (existingTempReservation) {
      return res.status(400).json({
        success: false,
        message:
          "Slot is being processed by another user. Please try again in a few minutes.",
      });
    }

    // Check if there are any confirmed appointments for this slot
    const existingAppointment = await appointmentModel.findOne({
      docId,
      slotDate,
      slotTime,
      payment: true,
      cancelled: false,
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "Slot is already booked!",
      });
    }

    const userData = await userModel.findById(userId).select("-password");

    delete docData.slots_booked;

    // Create temporary reservation (15 minutes expiry)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now

    const tempReservationData = {
      userId,
      docId,
      userData,
      docData,
      amount: docData.fees,
      slotTime,
      slotDate,
      reasonForVisit,
      sessionType,
      communicationMethod,
      briefNotes,
      emergencyContact,
      consentGiven,
      expiresAt,
    };

    const newTempReservation = new tempReservationModel(tempReservationData);
    await newTempReservation.save();

    res.status(201).json({
      success: true,
      message:
        "Slot reserved! Please complete payment to confirm your booking.",
      tempReservationId: newTempReservation._id,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Api to get user Appointments for frontend my appointments page
const listAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const appointments = await appointmentModel.find({ userId });
    res.status(201).json({ success: true, appointments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Api to Cancel Appointment
const cancelAppointment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);
    // verify appointment user
    if (appointmentData.userId !== userId) {
      return res
        .status(400)
        .json({ success: false, message: "Unauthorized Action!" });
    }

    await appointmentModel.findByIdAndUpdate(appointmentId, {
      cancelled: true,
    });

    // releasing doctor slot
    const { docId, slotDate, slotTime } = appointmentData;
    const doctorData = await doctorModel.findById(docId);

    let slots_booked = doctorData.slots_booked;

    slots_booked[slotDate] = slots_booked[slotDate].filter(
      (e) => e !== slotTime
    );

    await doctorModel.findByIdAndUpdate(docId, { slots_booked });

    res.status(201).json({ success: true, message: "Appointment Cancelled!" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ---------- RAZORPAY PAYMENT GATEWAY - INTEGRATION -----------

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Api to make payment of appointment using razorpay
const paymentRazorpay = async (req, res) => {
  try {
    const { tempReservationId } = req.body;
    const tempReservation = await tempReservationModel.findById(
      tempReservationId
    );

    if (!tempReservation) {
      return res.status(400).json({
        success: false,
        message: "Reservation not found!",
      });
    }

    // Check if reservation has expired
    if (tempReservation.expiresAt < new Date()) {
      // Clean up expired reservation
      await tempReservationModel.findByIdAndDelete(tempReservationId);
      return res.status(400).json({
        success: false,
        message: "Reservation has expired. Please try booking again.",
      });
    }

    // Check if user owns this reservation
    if (tempReservation.userId !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized access to reservation!",
      });
    }

    // Check if slot is still available
    const docData = await doctorModel.findById(tempReservation.docId);
    let slots_booked = docData.slots_booked;

    if (slots_booked[tempReservation.slotDate]) {
      if (
        slots_booked[tempReservation.slotDate].includes(
          tempReservation.slotTime
        )
      ) {
        // Slot is now booked, clean up reservation
        await tempReservationModel.findByIdAndDelete(tempReservationId);
        return res.status(400).json({
          success: false,
          message: "Slot is no longer available. Please select another time.",
        });
      }
    }

    // creating options for razorpay payment
    const options = {
      amount: tempReservation.amount * 100,
      currency: process.env.CURRENCY,
      receipt: tempReservationId,
    };

    // creation of an order
    const order = await razorpayInstance.orders.create(options);

    // Update reservation with order ID
    await tempReservationModel.findByIdAndUpdate(tempReservationId, {
      razorpayOrderId: order.id,
    });

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Api to verify payment of razorpay
const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id } = req.body;
    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      const tempReservationId = orderInfo.receipt;

      // Get the temporary reservation
      const tempReservation = await tempReservationModel.findById(
        tempReservationId
      );

      if (!tempReservation) {
        return res.status(404).json({
          success: false,
          message: "Reservation not found!",
        });
      }

      // Check if reservation has expired
      if (tempReservation.expiresAt < new Date()) {
        await tempReservationModel.findByIdAndDelete(tempReservationId);
        return res.status(400).json({
          success: false,
          message: "Reservation has expired. Please try booking again.",
        });
      }

      // Check if slot is still available
      const docData = await doctorModel.findById(tempReservation.docId);
      let slots_booked = docData.slots_booked || {};

      if (slots_booked[tempReservation.slotDate]) {
        if (
          slots_booked[tempReservation.slotDate].includes(
            tempReservation.slotTime
          )
        ) {
          // Slot is now booked, clean up reservation
          await tempReservationModel.findByIdAndDelete(tempReservationId);
          return res.status(400).json({
            success: false,
            message: "Slot is no longer available. Please select another time.",
          });
        }
      }

      // Create the actual appointment
      const appointmentData = {
        userId: tempReservation.userId,
        docId: tempReservation.docId,
        userData: tempReservation.userData,
        docData: tempReservation.docData,
        amount: tempReservation.amount,
        slotTime: tempReservation.slotTime,
        slotDate: tempReservation.slotDate,
        date: Date.now(),
        reasonForVisit: tempReservation.reasonForVisit,
        sessionType: tempReservation.sessionType,
        communicationMethod: tempReservation.communicationMethod,
        briefNotes: tempReservation.briefNotes,
        emergencyContact: tempReservation.emergencyContact,
        consentGiven: tempReservation.consentGiven,
        payment: true,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
      };

      const newAppointment = new appointmentModel(appointmentData);
      await newAppointment.save();

      // Mark the slot as booked in doctor's data
      if (slots_booked[tempReservation.slotDate]) {
        if (
          !slots_booked[tempReservation.slotDate].includes(
            tempReservation.slotTime
          )
        ) {
          slots_booked[tempReservation.slotDate].push(tempReservation.slotTime);
        }
      } else {
        slots_booked[tempReservation.slotDate] = [tempReservation.slotTime];
      }

      await doctorModel.findByIdAndUpdate(tempReservation.docId, {
        slots_booked,
      });

      // Delete the temporary reservation
      await tempReservationModel.findByIdAndDelete(tempReservationId);

      res.status(201).json({
        success: true,
        message: "Payment Successful! Your appointment is confirmed. 🎉",
        appointmentId: newAppointment._id,
      });
    } else {
      res.status(401).json({ success: false, message: "Payment Failed..." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Function to handle payment cancellation and cleanup
const cancelPayment = async (req, res) => {
  try {
    const { tempReservationId } = req.body;
    const tempReservation = await tempReservationModel.findById(
      tempReservationId
    );

    if (!tempReservation) {
      return res.status(404).json({
        success: false,
        message: "Reservation not found!",
      });
    }

    // Check if user owns this reservation
    if (tempReservation.userId !== req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Unauthorized access to reservation!",
      });
    }

    // Delete the temporary reservation
    await tempReservationModel.findByIdAndDelete(tempReservationId);

    res.status(200).json({
      success: true,
      message: "Payment cancelled. Slot is now available for booking.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Function to cleanup expired temporary reservations
const cleanupExpiredReservations = async () => {
  try {
    const now = new Date();

    // Find and delete expired temporary reservations
    const expiredReservations = await tempReservationModel.find({
      expiresAt: { $lt: now },
    });

    for (const reservation of expiredReservations) {
      await tempReservationModel.findByIdAndDelete(reservation._id);
      console.log(`Cleaned up expired reservation: ${reservation._id}`);
    }

    console.log(
      `Cleaned up ${expiredReservations.length} expired reservations`
    );
  } catch (error) {
    console.error("Error cleaning up expired reservations:", error);
  }
};

// Api to get real-time slot availability for a doctor
const getSlotAvailability = async (req, res) => {
  try {
    const { docId, slotDate } = req.params;

    // Get doctor's booked slots
    const doctorData = await doctorModel.findById(docId);
    if (!doctorData) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found!",
      });
    }

    const bookedSlots = doctorData.slots_booked?.[slotDate] || [];

    // Get active temporary reservations for this date
    const now = new Date();
    const activeReservations = await tempReservationModel.find({
      docId,
      slotDate,
      expiresAt: { $gt: now },
    });

    const reservedSlots = activeReservations.map(
      (reservation) => reservation.slotTime
    );

    // Combine booked and reserved slots
    const unavailableSlots = [...new Set([...bookedSlots, ...reservedSlots])];

    res.status(200).json({
      success: true,
      unavailableSlots,
      bookedSlots,
      reservedSlots,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Run cleanup every 5 minutes
setInterval(cleanupExpiredReservations, 5 * 60 * 1000);

// export all user controllers
export {
  registerUser,
  loginUser,
  googleLogin,
  getProfile,
  updateProfile,
  bookAppointment,
  listAppointment,
  cancelAppointment,
  paymentRazorpay,
  verifyRazorpay,
  getSlotAvailability,
  cancelPayment,
};
