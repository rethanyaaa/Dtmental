import React, { useState, useEffect, Suspense, lazy } from "react";
import { Routes, Route, useLocation } from "react-router-dom"; // Added useLocation
import Home from "./pages/Home";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyProfile from "./pages/MyProfile";
import MyAppointments from "./pages/MyAppointments";
import Appointment from "./pages/Appointment";
import Navbar from "./components/Navbar";

import Footer from "./components/Footer";
import ScrollToTopFloatingButton from "./components/ScrollToTopFloatingButton";
import { ToastContainer } from "react-toastify";
import WelcomeLoader from "./components/WelcomeLoader";

import Services from "./pages/Services";
import OurTeam from "./pages/Team";
import MoodTracker from "../MoodAnalyzer/moodtracker";
import MoodAnalysis from "./pages/MoodAnalysis";
import MoodDashboard from "./pages/MoodDashboard";
import MoodTest from "./components/MoodAnalysis/MoodTest";
import Child from "./components/Assessment/Child";

import Family from "./components/Assessment/family";
import Individual from "./components/Assessment/individual";
import Result from "./pages/Result";

import Resources from "./pages/Resources";
import Couples from "./components/Assessment/Couples";

import Assessments from "./pages/Assessments";
import Assessment from "./pages/Assessment";
import MyAssessments from "./pages/MyAssessments";
import AssessmentDetailedResults from "./components/AssessmentDetailedResults";
import CancellationPolicy from "./pages/CancellationPolicy";
import BlogPost from "./pages/BlogPost";
import WriteBlog from "./pages/WriteBlog";
import AIMoodTracker from "./pages/AIMoodTracker";
import Notifications from "./pages/Notifications";

// Lazy load components
const Doctors = lazy(() => import("./pages/Doctors"));

// ScrollToTop component
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const App = () => {
  const [showLoader, setShowLoader] = useState(true);
  const location = useLocation();

  const loaderComponent = (
    <div
      id="welcome-loader"
      className="fixed inset-0 z-50 transition-opacity duration-500 ease-in-out pointer-events-none"
      style={{
        opacity: showLoader ? 1 : 0,
        backgroundColor: "white",
      }}
    >
      <WelcomeLoader />
    </div>
  );

  useEffect(() => {
    setTimeout(() => {
      setShowLoader(false);
    }, 5000);
  }, []);

  // Temporary debug - remove this later
  console.log("🚀 App.jsx - Environment check:");
  console.log("VITE_GOOGLE_CLIENT_ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);
  console.log("VITE_BACKEND_URL:", import.meta.env.VITE_BACKEND_URL);

  return (
    <>
      {showLoader && loaderComponent}
      <div>
        <ToastContainer
          theme="light"
          className="scale-95  sm:scale-100 sm:mt-16"
        />
        <Navbar />
        <ScrollToTop /> {/* Add this component */}
        {location.pathname !== "/" && <ScrollToTopFloatingButton />}
        <Suspense fallback={loaderComponent}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:speciality" element={<Doctors />} />
            <Route path="/login" element={<Login />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/ourTeam" element={<OurTeam />} />

            <Route path="/contact" element={<Contact />} />
            <Route path="/my-profile" element={<MyProfile />} />
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/appointment/:docId" element={<Appointment />} />
            <Route
              path="/cancellation-policy"
              element={<CancellationPolicy />}
            />

            {/* Assessment routes */}
            <Route path="/individual" element={<Assessments />} />
            <Route path="/assessment/:id" element={<Assessment />} />
            <Route path="/my-assessments" element={<MyAssessments />} />
            <Route
              path="/assessment-results/:id"
              element={<AssessmentDetailedResults />}
            />

            {/* Assessment routes */}
            <Route path="/mood-analysis" element={<MoodAnalysis />} />
            <Route path="/moodtracker" element={<MoodTracker />} />
            <Route path="/mood-dashboard" element={<MoodDashboard />} />
            <Route path="/moodtest" element={<MoodTest />} />
            <Route path="/child" element={<Child />} />
            <Route path="/couples" element={<Couples />} />
            <Route path="/family" element={<Family />} />
            <Route path="/individual" element={<Individual />} />

            {/* MOOD ANALYZER routes */}

            <Route path="/ai-moodtracker" element={<AIMoodTracker />} />
            <Route path="/notifications" element={<Notifications />} />

            <Route path="/result" element={<Result />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/write-blog" element={<WriteBlog />} />
          </Routes>
        </Suspense>
        <Footer />
      </div>
    </>
  );
};

export default App;
