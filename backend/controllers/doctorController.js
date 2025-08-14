import doctorModel from "../models/doctorModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import appointmentModel from "../models/appointmentModel.js";
import userModel from "../models/userModel.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";

const changeAvailability = async (req, res) => {
  try {
    const { docId } = req.body;

    const docData = await doctorModel.findById(docId);

    await doctorModel.findByIdAndUpdate(docId, {
      available: !docData.available,
    });

    res.status(200).json({ success: true, message: "Availability Changed!" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

const doctorList = async (req, res) => {
  try {
    const doctors = await doctorModel.find({}).select(["-password", "-email"]);
    res.status(201).json({ success: true, doctors });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

// Api for doctor login
const loginDoctor = async (req, res) => {
  try {
    const { email, password } = req.body;
    const doctor = await doctorModel.findOne({ email });

    if (!doctor) {
      return res.json({ success: false, message: "Invalid Credentials!" });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);

    if (isMatch) {
      const token = jwt.sign({ id: doctor._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      return res.json({ success: false, message: "Invalid Credentials!" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

// API to get doctor appointments for doctor panal
const appointmentsDoctor = async (req, res) => {
  try {
    const { docId } = req.body;
    const appointments = await appointmentModel.find({ docId });

    res.json({ success: true, appointments });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

// API to mark appointment as completed from doctor panel
const appointmentComplete = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        isCompleted: true,
      });
      res.json({ success: true, message: "Appointment Completed. 🎉" });
    } else {
      res.json({ success: false, message: "Mark Failed !!" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: `Server error: ${error.message}` });
  }
};

// API to cancel appointment from doctor panel
const appointmentCancel = async (req, res) => {
  try {
    const { docId, appointmentId } = req.body;
    const appointmentData = await appointmentModel.findById(appointmentId);

    if (appointmentData && appointmentData.docId === docId) {
      await appointmentModel.findByIdAndUpdate(appointmentId, {
        cancelled: true,
      });
      res.json({ success: true, message: "Appointment Cancelled." });
    } else {
      res.json({ success: false, message: "Cancellation Failed !!" });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: `Server error: ${error.message}` });
  }
};

// API to get dashboard data for doctor panel
const doctorDashboard = async (req, res) => {
  try {
    const { docId } = req.body;

    const appointments = await appointmentModel.find({ docId });

    const docName = await doctorModel.findById(docId).select("name");

    let earnings = 0;

    appointments.map((item) => {
      if (item.payment) {
        earnings += item.amount;
      }
    });

    let patients = [];
    appointments.map((item) => {
      if (!patients.includes(item.userId)) {
        patients.push(item.userId);
      }
    });

    const dashData = {
      docName,
      earnings,
      appointments: appointments.length,
      patients: patients.length,
      latestAppointments: appointments.reverse().slice(0, 5),
    };

    res.status(201).json({ success: true, dashData });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

// API to get doctor profile for doctor panel
const doctorProfile = async (req, res) => {
  try {
    const { docId } = req.body;
    const profileData = await doctorModel.findById(docId).select("-password");
    res.status(201).json({ success: true, profileData });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

// API to update doctor profile for doctor panel
const updateDoctorProfile = async (req, res) => {
  try {
    const { docId, address, fees, experience, available } = req.body;

    await doctorModel.findByIdAndUpdate(docId, {
      address,
      fees,
      experience,
      available,
    });

    res.status(201).json({ success: true, message: "Profile Updated. 🎉" });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

// API to get patients data for a specific doctor
const getDoctorPatients = async (req, res) => {
  try {
    const { docId } = req.body;

    // Get all appointments for this doctor
    const appointments = await appointmentModel.find({ docId });

    // Extract unique patient IDs
    const patientIds = [...new Set(appointments.map((app) => app.userId))];

    // Get detailed patient information
    const patientsData = await Promise.all(
      patientIds.map(async (patientId) => {
        const patient = await userModel.findById(patientId);
        if (!patient) return null;

        // Get appointments for this specific patient with this doctor
        const patientAppointments = appointments.filter(
          (app) => app.userId === patientId
        );

        // Calculate total amount paid by this patient
        const totalAmount = patientAppointments.reduce((sum, app) => {
          if (app.payment) {
            return sum + app.amount;
          }
          return sum;
        }, 0);

        // Get appointment statistics
        const totalAppointments = patientAppointments.length;
        const completedAppointments = patientAppointments.filter(
          (app) => app.isCompleted
        ).length;
        const cancelledAppointments = patientAppointments.filter(
          (app) => app.cancelled
        ).length;
        const pendingAppointments = patientAppointments.filter(
          (app) => !app.isCompleted && !app.cancelled
        ).length;

        // Get latest appointment
        const latestAppointment = patientAppointments.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        )[0];

        return {
          patientId: patient._id,
          name: patient.name,
          email: patient.email,
          image: patient.image,
          phone: patient.phone,
          gender: patient.gender,
          dob: patient.dob,
          address: patient.address,
          joinedDate: patient.joinedDate,
          // Appointment statistics
          totalAppointments,
          completedAppointments,
          cancelledAppointments,
          pendingAppointments,
          totalAmount,
          latestAppointment: latestAppointment
            ? {
                date: latestAppointment.slotDate,
                time: latestAppointment.slotTime,
                status: latestAppointment.cancelled
                  ? "Cancelled"
                  : latestAppointment.isCompleted
                  ? "Completed"
                  : "Pending",
                amount: latestAppointment.amount,
              }
            : null,
        };
      })
    );

    // Filter out null values and sort by latest appointment
    const validPatients = patientsData
      .filter((patient) => patient !== null)
      .sort((a, b) => {
        if (!a.latestAppointment && !b.latestAppointment) return 0;
        if (!a.latestAppointment) return 1;
        if (!b.latestAppointment) return -1;
        return (
          new Date(b.latestAppointment.date) -
          new Date(a.latestAppointment.date)
        );
      });

    res.status(200).json({
      success: true,
      patients: validPatients,
      totalPatients: validPatients.length,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

// API to download doctor's patients PDF report
const downloadDoctorPatientsPDF = async (req, res) => {
  try {
    const { docId } = req.body; // Get from authenticated token via middleware
    const { reportType = "30months" } = req.query;

    // Calculate date based on report type
    let startDate, periodText, periodDays;

    switch (reportType) {
      case "12months":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
        periodText = "Last 12 Months";
        periodDays = 365;
        break;
      case "6months":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        periodText = "Last 6 Months";
        periodDays = 180;
        break;
      case "30months":
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        periodText = "Last 30 Days";
        periodDays = 30;
        break;
    }

    const startDateTimestamp = startDate.getTime();

    // Get doctor details
    const doctor = await doctorModel.findById(docId).select("-password");
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Get all patients who have appointments with this doctor
    const appointments = await appointmentModel.find({
      docId,
      date: { $gte: startDateTimestamp },
    });

    // Extract unique patient IDs
    const patientIds = [...new Set(appointments.map((app) => app.userId))];

    // Get detailed patient information
    const uniquePatients = await Promise.all(
      patientIds.map(async (patientId) => {
        const patient = await userModel.findById(patientId).select("-password");
        return patient;
      })
    );

    // Filter out null values
    const validPatients = uniquePatients.filter((patient) => patient !== null);

    // Create PDF document
    const doc = new PDFDocument({
      margin: 50,
      size: "A4",
      info: {
        Title: `Doctor's Patients Report for ${periodText}`,
        Author: "MOOD MANTA",
        Subject: "Doctor's Patients and Analytics",
        Keywords: "doctor, patients, appointments, analytics",
        CreationDate: new Date(),
      },
    });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="doctor-patients-${reportType}-${
        new Date().toISOString().split("T")[0]
      }.pdf"`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // Add title page
    doc
      .fontSize(28)
      .font("Helvetica-Bold")
      .text("Doctor's Patients Report", { align: "center" })
      .moveDown(2);

    doc
      .fontSize(16)
      .font("Helvetica")
      .text("Mental Health Platform", { align: "center" })
      .moveDown(2);

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Generated on: ${new Date().toLocaleDateString()}`, {
        align: "center",
      })
      .text(
        `Period: ${periodText} (${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()})`,
        { align: "center" }
      )
      .moveDown(1);

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text(`Doctor: ${doctor.name}`, { align: "center" })
      .text(`Speciality: ${doctor.speciality}`, { align: "center" })
      .moveDown(3);

    // Add summary statistics
    const totalPatients = validPatients.length;
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (app) => app.isCompleted
    ).length;
    const cancelledAppointments = appointments.filter(
      (app) => app.cancelled
    ).length;
    const pendingAppointments = appointments.filter(
      (app) => !app.isCompleted && !app.cancelled
    ).length;
    const totalRevenue = appointments
      .filter((app) => app.isCompleted || app.payment)
      .reduce((sum, app) => sum + app.amount, 0);

    // Summary section
    doc.addPage();
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Executive Summary", { underline: true })
      .moveDown(2);

    doc
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Key Statistics:", { underline: true })
      .moveDown();

    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`• Total Patients: ${totalPatients}`)
      .text(`• Appointments (${periodText}): ${totalAppointments}`)
      .text(`• Completed Appointments: ${completedAppointments}`)
      .text(`• Pending Appointments: ${pendingAppointments}`)
      .text(`• Cancelled Appointments: ${cancelledAppointments}`)
      .text(
        `• Total Revenue (${periodText}): ₹${totalRevenue.toLocaleString()}`
      )
      .text(
        `• Average Revenue per Patient: ₹${
          totalPatients > 0 ? (totalRevenue / totalPatients).toFixed(2) : 0
        }`
      )
      .moveDown(2);

    // Calculate completion rate
    const completionRate =
      totalAppointments > 0
        ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
        : 0;
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`• Appointment Completion Rate: ${completionRate}%`)
      .moveDown(2);

    // Process each patient
    if (validPatients.length > 0) {
      doc.addPage();
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("Patient Details", { underline: true })
        .moveDown(2);

      validPatients.forEach((patient, index) => {
        // Get appointments for this patient from the selected period
        const patientAppointments = appointments.filter(
          (app) => app.userId === patient._id.toString()
        );

        // Calculate patient statistics
        const patientTotalAppointments = patientAppointments.length;
        const patientCompletedAppointments = patientAppointments.filter(
          (app) => app.isCompleted
        ).length;
        const patientCancelledAppointments = patientAppointments.filter(
          (app) => app.cancelled
        ).length;
        const patientTotalAmount = patientAppointments
          .filter((app) => app.isCompleted || app.payment)
          .reduce((sum, app) => sum + app.amount, 0);

        // Add page break if not first patient and if we're near the bottom
        if (index > 0 && doc.y > 600) {
          doc.addPage();
        }

        // Patient header
        doc
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(`${index + 1}. ${patient.name}`, { underline: true })
          .moveDown(0.5);

        // Patient details
        doc
          .fontSize(11)
          .font("Helvetica")
          .text(`Email: ${patient.email}`)
          .text(`Phone: ${patient.phone}`)
          .text(`Gender: ${patient.gender || "Not specified"}`)
          .text(
            `Date of Birth: ${
              patient.dob
                ? new Date(patient.dob).toLocaleDateString()
                : "Not specified"
            }`
          )
          .text(
            `Joined Date: ${new Date(patient.joinedDate).toLocaleDateString()}`
          )
          .moveDown(0.5);

        // Address
        if (patient.address) {
          const address =
            typeof patient.address === "string"
              ? patient.address
              : `${patient.address.line1 || ""} ${
                  patient.address.line2 || ""
                }`.trim();
          doc.text(`Address: ${address || "Not provided"}`);
        }

        // Patient statistics (selected period)
        doc
          .moveDown(0.5)
          .fontSize(12)
          .font("Helvetica-Bold")
          .text(`Appointments (${periodText}):`, { underline: true })
          .moveDown(0.3);

        doc
          .fontSize(11)
          .font("Helvetica")
          .text(`• Total Appointments: ${patientTotalAppointments}`)
          .text(`• Completed: ${patientCompletedAppointments}`)
          .text(`• Cancelled: ${patientCancelledAppointments}`)
          .text(`• Total Amount Paid: ₹${patientTotalAmount.toLocaleString()}`)
          .moveDown(0.5);

        // Recent appointments (last 5 from the selected period)
        if (patientAppointments.length > 0) {
          doc
            .fontSize(12)
            .font("Helvetica-Bold")
            .text(`Recent Appointments (${periodText}):`, { underline: true })
            .moveDown(0.3);

          const recentAppointments = patientAppointments
            .sort((a, b) => b.date - a.date) // Sort by timestamp
            .slice(0, 5);

          recentAppointments.forEach((app) => {
            const status = app.cancelled
              ? "Cancelled"
              : app.isCompleted
              ? "Completed"
              : "Pending";
            const appointmentDate = new Date(app.date).toLocaleDateString();

            doc
              .fontSize(10)
              .font("Helvetica")
              .text(
                `• ${appointmentDate} at ${app.slotTime} (${status}) - ₹${app.amount}`
              );
          });
        } else {
          doc
            .fontSize(10)
            .font("Helvetica")
            .text(`No appointments in the ${periodText.toLowerCase()}`)
            .moveDown(0.3);
        }

        doc.moveDown(1.5);
      });
    } else {
      doc.addPage();
      doc.fontSize(16).font("Helvetica").text("No patients found.", {
        align: "center",
      });
    }

    // Add footer
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Report generated on ${new Date().toLocaleString()}`, {
        align: "center",
      });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      success: false,
      message: `Error generating PDF: ${error.message}`,
    });
  }
};

// API to download doctor patients report as Excel
const downloadDoctorPatientsExcel = async (req, res) => {
  try {
    const { docId } = req.body; // Get from authenticated token via middleware
    const { reportType = "30months" } = req.query;

    // Calculate date based on report type
    let startDate, periodText, periodDays;

    switch (reportType) {
      case "12months":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 12);
        periodText = "Last 12 Months";
        periodDays = 365;
        break;
      case "6months":
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        periodText = "Last 6 Months";
        periodDays = 180;
        break;
      case "30months":
      default:
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
        periodText = "Last 30 Days";
        periodDays = 30;
        break;
    }

    const startDateTimestamp = startDate.getTime();

    // Get doctor details
    const doctor = await doctorModel.findById(docId).select("-password");
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Get all patients who have appointments with this doctor
    const appointments = await appointmentModel.find({
      docId,
      date: { $gte: startDateTimestamp },
    });

    // Extract unique patient IDs
    const patientIds = [...new Set(appointments.map((app) => app.userId))];

    // Get detailed patient information
    const uniquePatients = await Promise.all(
      patientIds.map(async (patientId) => {
        const patient = await userModel.findById(patientId).select("-password");
        return patient;
      })
    );

    // Filter out null values
    const validPatients = uniquePatients.filter((patient) => patient !== null);

    // Create Excel workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Patients Report");

    // Set up headers
    worksheet.columns = [
      { header: "Patient Name", key: "name", width: 20 },
      { header: "Email", key: "email", width: 25 },
      { header: "Phone", key: "phone", width: 15 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Date of Birth", key: "dob", width: 15 },
      { header: "Age", key: "age", width: 10 },
      { header: "Joined Date", key: "joinedDate", width: 15 },
      { header: "Address", key: "address", width: 30 },
      { header: "Total Appointments", key: "totalAppointments", width: 15 },
      {
        header: "Completed Appointments",
        key: "completedAppointments",
        width: 20,
      },
      {
        header: "Cancelled Appointments",
        key: "cancelledAppointments",
        width: 20,
      },
      { header: "Total Amount Paid", key: "totalAmount", width: 15 },
      { header: "Last Appointment Date", key: "lastAppointment", width: 20 },
      {
        header: "Last Appointment Status",
        key: "lastAppointmentStatus",
        width: 20,
      },
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: "FFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" },
    };
    headerRow.alignment = { horizontal: "center", vertical: "middle" };

    // Add data rows
    validPatients.forEach((patient, index) => {
      // Get appointments for this patient from the selected period
      const patientAppointments = appointments.filter(
        (app) => app.userId === patient._id.toString()
      );

      // Calculate patient statistics
      const patientTotalAppointments = patientAppointments.length;
      const patientCompletedAppointments = patientAppointments.filter(
        (app) => app.isCompleted
      ).length;
      const patientCancelledAppointments = patientAppointments.filter(
        (app) => app.cancelled
      ).length;
      const patientTotalAmount = patientAppointments
        .filter((app) => app.isCompleted || app.payment)
        .reduce((sum, app) => sum + app.amount, 0);

      // Get last appointment details
      const lastAppointment = patientAppointments
        .sort((a, b) => b.date - a.date)
        .find(() => true);

      // Calculate age
      const age = patient.dob
        ? Math.floor(
            (new Date() - new Date(patient.dob)) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : "N/A";

      // Format address
      const address = patient.address
        ? typeof patient.address === "string"
          ? patient.address
          : `${patient.address.line1 || ""} ${
              patient.address.line2 || ""
            }`.trim()
        : "Not provided";

      // Add row data
      worksheet.addRow({
        name: patient.name,
        email: patient.email,
        phone: patient.phone,
        gender: patient.gender || "Not specified",
        dob: patient.dob
          ? new Date(patient.dob).toLocaleDateString()
          : "Not specified",
        age: age,
        joinedDate: new Date(patient.joinedDate).toLocaleDateString(),
        address: address,
        totalAppointments: patientTotalAppointments,
        completedAppointments: patientCompletedAppointments,
        cancelledAppointments: patientCancelledAppointments,
        totalAmount: `₹${patientTotalAmount.toLocaleString()}`,
        lastAppointment: lastAppointment
          ? new Date(lastAppointment.date).toLocaleDateString()
          : "No appointments",
        lastAppointmentStatus: lastAppointment
          ? lastAppointment.cancelled
            ? "Cancelled"
            : lastAppointment.isCompleted
            ? "Completed"
            : "Pending"
          : "N/A",
      });
    });

    // Add summary statistics worksheet
    const summaryWorksheet = workbook.addWorksheet("Summary Statistics");

    // Calculate summary statistics
    const totalPatients = validPatients.length;
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (app) => app.isCompleted
    ).length;
    const cancelledAppointments = appointments.filter(
      (app) => app.cancelled
    ).length;
    const pendingAppointments = appointments.filter(
      (app) => !app.isCompleted && !app.cancelled
    ).length;
    const totalRevenue = appointments
      .filter((app) => app.isCompleted || app.payment)
      .reduce((sum, app) => sum + app.amount, 0);
    const completionRate =
      totalAppointments > 0
        ? ((completedAppointments / totalAppointments) * 100).toFixed(1)
        : 0;

    // Add summary data
    summaryWorksheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 20 },
    ];

    const summaryHeaderRow = summaryWorksheet.getRow(1);
    summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFF" } };
    summaryHeaderRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "4472C4" },
    };

    summaryWorksheet.addRow({ metric: "Report Period", value: periodText });
    summaryWorksheet.addRow({ metric: "Doctor Name", value: doctor.name });
    summaryWorksheet.addRow({ metric: "Speciality", value: doctor.speciality });
    summaryWorksheet.addRow({ metric: "Total Patients", value: totalPatients });
    summaryWorksheet.addRow({
      metric: "Total Appointments",
      value: totalAppointments,
    });
    summaryWorksheet.addRow({
      metric: "Completed Appointments",
      value: completedAppointments,
    });
    summaryWorksheet.addRow({
      metric: "Pending Appointments",
      value: pendingAppointments,
    });
    summaryWorksheet.addRow({
      metric: "Cancelled Appointments",
      value: cancelledAppointments,
    });
    summaryWorksheet.addRow({
      metric: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
    });
    summaryWorksheet.addRow({
      metric: "Average Revenue per Patient",
      value: `₹${
        totalPatients > 0 ? (totalRevenue / totalPatients).toFixed(2) : 0
      }`,
    });
    summaryWorksheet.addRow({
      metric: "Appointment Completion Rate",
      value: `${completionRate}%`,
    });
    summaryWorksheet.addRow({
      metric: "Report Generated On",
      value: new Date().toLocaleString(),
    });

    // Set response headers for Excel download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="doctor-patients-${reportType}-${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );

    // Write the workbook to the response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Error generating Excel:", error);
    res.status(500).json({
      success: false,
      message: `Error generating Excel: ${error.message}`,
    });
  }
};

// API to get patient mood data for doctor
const getPatientMoodData = async (req, res) => {
  try {
    const { docId } = req.body;
    const { patientId, period = "30" } = req.query; // period in days

    // Verify the doctor has appointments with this patient
    const appointment = await appointmentModel.findOne({
      docId,
      userId: patientId,
    });

    if (!appointment) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this patient's data",
      });
    }

    // Get patient information
    const patient = await userModel.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    // Check if mood tracking is enabled for this patient
    if (!patient.moodTracking?.enabled) {
      return res.status(200).json({
        success: true,
        patient: {
          _id: patient._id,
          name: patient.name,
          email: patient.email,
          image: patient.image,
        },
        moodData: null,
        message: "Mood tracking is not enabled for this patient",
      });
    }

    // Import mood tracking models
    const { MoodEntry, AIAnalysis } = await import(
      "../models/moodTrackingModel.js"
    );

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get mood entries for the specified period
    const moodEntries = await MoodEntry.find({
      userId: patientId,
      timestamp: { $gte: startDate, $lte: endDate },
    }).sort({ timestamp: -1 });

    // Get latest AI analysis
    const latestAnalysis = await AIAnalysis.findOne({
      userId: patientId,
    }).sort({ analysisDate: -1 });

    // Calculate basic analytics
    const analytics = calculatePatientMoodAnalytics(moodEntries);

    // Get appointment history with this doctor
    const appointments = await appointmentModel
      .find({
        docId,
        userId: patientId,
      })
      .sort({ slotDate: -1 });

    res.status(200).json({
      success: true,
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        image: patient.image,
        phone: patient.phone,
        gender: patient.gender,
        dob: patient.dob,
        moodTrackingEnabled: patient.moodTracking?.enabled,
        aiAnalysisConsent: patient.moodTracking?.aiAnalysisConsent,
      },
      moodData: {
        entries: moodEntries,
        analytics,
        aiAnalysis: latestAnalysis,
        totalEntries: moodEntries.length,
        period: parseInt(period),
        dateRange: {
          start: startDate,
          end: endDate,
        },
      },
      appointments: {
        total: appointments.length,
        completed: appointments.filter((app) => app.isCompleted).length,
        cancelled: appointments.filter((app) => app.cancelled).length,
        pending: appointments.filter(
          (app) => !app.isCompleted && !app.cancelled
        ).length,
        history: appointments.slice(0, 10), // Last 10 appointments
      },
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: `Server error: ${error.message}` });
  }
};

// Helper function to calculate patient mood analytics
const calculatePatientMoodAnalytics = (moodEntries) => {
  if (moodEntries.length === 0) {
    return {
      basicStats: {
        totalEntries: 0,
        averageScore: 0,
        minScore: 0,
        maxScore: 0,
      },
      moodDistribution: {},
      trend: "no_data",
      trendStrength: 0,
      moodVariability: 0,
      moodStability: 0,
    };
  }

  const scores = moodEntries.map((entry) => entry.moodScore);
  const averageScore =
    scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);

  // Calculate mood distribution
  const moodDistribution = moodEntries.reduce((acc, entry) => {
    acc[entry.moodLabel] = (acc[entry.moodLabel] || 0) + 1;
    return acc;
  }, {});

  // Calculate trend
  const sortedEntries = [...moodEntries].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  const firstHalf = sortedEntries.slice(
    0,
    Math.floor(sortedEntries.length / 2)
  );
  const secondHalf = sortedEntries.slice(Math.floor(sortedEntries.length / 2));

  const firstHalfAvg =
    firstHalf.length > 0
      ? firstHalf.reduce((sum, entry) => sum + entry.moodScore, 0) /
        firstHalf.length
      : 0;
  const secondHalfAvg =
    secondHalf.length > 0
      ? secondHalf.reduce((sum, entry) => sum + entry.moodScore, 0) /
        secondHalf.length
      : 0;

  let trend = "stable";
  if (secondHalfAvg > firstHalfAvg + 0.5) trend = "improving";
  else if (secondHalfAvg < firstHalfAvg - 0.5) trend = "declining";

  // Calculate trend strength
  const trendStrength = Math.abs(secondHalfAvg - firstHalfAvg) / 5; // Normalize to 0-1

  // Calculate mood variability
  const variance =
    scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) /
    scores.length;
  const moodVariability = Math.sqrt(variance) / 5; // Normalize to 0-1

  // Calculate mood stability (inverse of variability)
  const moodStability = Math.max(0, 1 - moodVariability);

  return {
    basicStats: {
      totalEntries: moodEntries.length,
      averageScore: parseFloat(averageScore.toFixed(2)),
      minScore,
      maxScore,
    },
    moodDistribution,
    trend,
    trendStrength: parseFloat(trendStrength.toFixed(3)),
    moodVariability: parseFloat(moodVariability.toFixed(3)),
    moodStability: parseFloat(moodStability.toFixed(3)),
  };
};

export {
  changeAvailability,
  doctorList,
  loginDoctor,
  appointmentsDoctor,
  appointmentComplete,
  appointmentCancel,
  doctorDashboard,
  doctorProfile,
  updateDoctorProfile,
  getDoctorPatients,
  downloadDoctorPatientsPDF,
  downloadDoctorPatientsExcel,
  getPatientMoodData,
};
