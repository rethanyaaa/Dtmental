// backend/index.js (or your main server file)
import express from "express";
import cors from "cors";
import "dotenv/config";
import connetDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import adminRouter from "./routes/adminRoute.js";
import doctorRouter from "./routes/doctorRoute.js";
import userRouter from "./routes/userRoute.js";
import assessmentRouter from "./routes/assessmentRoute.js";
import testimonialRouter from "./routes/testimonialRoute.js";
import blogPostRouter from "./routes/blogPostRoute.js";
import uploadRouter from "./routes/uploadRoute.js";
import moodTrackingRouter from "./routes/moodTrackingRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import notificationService from "./services/notificationService.js";

// -------- app config ----------
const app = express();
const port = process.env.PORT || 4000;
connetDB();
connectCloudinary();

// -------- middlewares ---------
app.use(express.json({ limit: "400mb" }));
app.use(cors());

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// ------ api endpoints ------
app.use("/api/admin", adminRouter);
app.use("/api/doctor", doctorRouter);
app.use("/api/user", userRouter);
app.use("/api/assessments", assessmentRouter);
app.use("/api/testimonials", testimonialRouter);
app.use("/api/blog-posts", blogPostRouter);
app.use("/api/upload", uploadRouter);
app.use("/api/mood-tracking", moodTrackingRouter);
app.use("/api/notifications", notificationRouter);

app.get("/", (req, res) => {
  res.send("API WORKING...");
});

app.get("/test", (req, res) => {
  res.json({ message: "Backend server is running!" });
});

// -------- port listen -------
app.listen(port, () => {
  console.log("Server Running on port", port);

  // Start notification service
  notificationService.start();
  console.log("Notification service started");
});
