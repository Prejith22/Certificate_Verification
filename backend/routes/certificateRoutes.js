const crypto = require("crypto"); // Import crypto for hashing
const path = require("path");
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const QRCode = require("qrcode");
const mongoose = require("mongoose");
const { verifyToken } = require("../middleware/authMiddleware");
const CertificateRequest = require("../models/CertificateRequest"); // Ensure this is correct
const College = require("../models/College");
const Student = require("../models/Student"); // ✅ Import the User model


// ✅ Blockchain Dependencies
const { ethers } = require("ethers");
const contractABI = require("../blockchain/CertificateVerificationABI.json").abi; 
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with deployed contract address

// ✅ Connect to Ethereum Network
const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // Hardhat local blockchain
const privateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Replace with College's private key
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, contractABI, wallet);

console.log("🔍 Contract Object Initialized");

const router = express.Router();

// ✅ Ensure "uploads/" directory exists
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/certificates/");
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ Upload Certificate Route
router.post("/upload", verifyToken, upload.single("certificate"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { originalname, filename } = req.file; // ✅ Get uploaded file name
    const studentId = req.user.id; // ✅ Extract student ID from token

    console.log("📌 Student ID:", studentId); // 🔍 Debug: Check if ID is present

    // ✅ Fetch student name from User model
    const student = await Student.findById(studentId);
    if (!student) {
      console.error("❌ Student not found in MongoDB:", studentId);
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // ✅ Generate a file hash (SHA256)
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    // ✅ Generate a Unique Certificate ID
    const certificateId = `CERT-${Date.now()}-${fileHash.substring(0, 8)}`;

    // ✅ Generate a QR Code for verification
    const qrCodeData = `http://localhost:5001/api/certificate/verify/${certificateId}`;
    const qrCodeFileName = `${certificateId}.png`;
    const qrCodePath = path.join(__dirname, "../uploads/qrcodes", qrCodeFileName); // ✅ Corrected Path

    // ✅ Ensure directory exists before saving QR code
    fs.mkdirSync(path.dirname(qrCodePath), { recursive: true });
    await QRCode.toFile(qrCodePath, qrCodeData);

    // ✅ Save **relative** file paths in MongoDB
    const fileUrl = `uploads/certificates/${filename}`; // ✅ Save relative path
    const qrCodeUrl = `uploads/qrcodes/${qrCodeFileName}`; // ✅ Save relative path

    // ✅ Save certificate with additional details
    const newCertificate = new CertificateRequest({
      studentId,
      studentName: student.name, 
      fileName: originalname,
      fileUrl, // ✅ Corrected File URL
      fileHash,
      certificateId,  
      qrCode: qrCodeUrl,  // ✅ Save relative path
      status: "Pending",
    });

    console.log("✅ Certificate Data before saving:", newCertificate); // 🔍 Debug

    await newCertificate.save();
    res.json({
      success: true, 
      message: "Certificate uploaded successfully", 
      certificate: newCertificate
    });

  } catch (error) {
    console.error("📌 Upload Error:", error); // 🔴 This will print the exact error
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ✅ Verify Certificate via Certificate ID (instead of hash)
router.get("/verify/:certificateId", verifyToken, async (req, res) => {
  try {
      const { certificateId } = req.params;
      console.log("🔍 Searching for certificate with ID:", certificateId);  // ✅ Log the received ID

      // ✅ Fix: Search by `certificateId` instead of `uniqueCertificateId`
      const certificate = await CertificateRequest.findOne({ certificateId }).populate("studentId");

      if (!certificate) {
          console.log("❌ No certificate found for ID:", certificateId);  // ✅ Log if not found
          return res.status(404).json({ success: false, message: "Certificate not found" });
      }

      console.log("✅ Certificate found:", certificate);  // ✅ Log the found certificate

      const studentName = certificate.studentId ? certificate.studentId.name : "Unknown Student";
      return res.json({
        success: true,
        certificate: {
            certificateId: certificate.certificateId,
            studentId: certificate.studentId ? certificate.studentId._id : null,  // ✅ Include studentId
            studentName: studentName,
            fileName: certificate.fileName,
            fileUrl: certificate.fileUrl,
            status: certificate.status,
            createdAt: certificate.createdAt,
        },
    });    
  } catch (error) {
      console.error("❌ Server error while verifying certificate:", error);
      res.status(500).json({ success: false, message: "Server error while verifying certificate" });
  }
});



// ✅ Fetch Certificates for a Student
router.get("/student", verifyToken, async (req, res) => {
  try {
    const certificates = await CertificateRequest.find({ studentId: req.user.id });

    const blockchainData = await Promise.all(
      certificates.map(async (cert) => {
        try {
          const isVerified = await contract.isCertificateVerified(cert.fileHash);
          return {
            ...cert.toObject(),
            isVerified,
          };
        } catch (blockchainError) {
          console.error("❌ Blockchain Error:", blockchainError);
          return { ...cert.toObject(), isVerified: false };
        }
      })
    );

    res.status(200).json(blockchainData);
  } catch (err) {
    console.error("❌ Error fetching certificates:", err);
    res.status(500).json({ success: false, message: "Error fetching certificates" });
  }
});

// ✅ Fetch Registered Colleges
router.get("/colleges", async (req, res) => {
  try {
    const colleges = await College.find({}, "name _id");

    if (!colleges || colleges.length === 0) {
      return res.status(404).json({ success: false, message: "No registered colleges found." });
    }

    res.json({ success: true, colleges });
  } catch (err) {
    console.error("❌ Error fetching colleges:", err);
    res.status(500).json({ success: false, message: "Error fetching colleges" });
  }
});


// ✅ Fetch Requests for a College
router.get("/requests/college", verifyToken, async (req, res) => {
  try {
    const collegeId = req.user.id; // ✅ Ensure college is authenticated
    console.log("📌 Logged-in College ID:", collegeId);

    // 🔥 Fetch only requests assigned to this college
    const requests = await CertificateRequest.find({ collegeId })
      .populate("studentId", "name email registerNo degree course batch") // Populate required fields
      .populate("collegeId", "name"); // Populate College Name for reference

    if (!requests || requests.length === 0) {
      console.log("❌ No requests found for this college:", collegeId);
      return res.status(404).json({ success: false, message: "No requests found" });
    }

    console.log("🎯 Requests for this College:", requests);

    res.json({ success: true, requests });
  } catch (error) {
    console.error("❌ Error fetching requests:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});



// ✅ Send Verification Request
router.post("/request", verifyToken, async (req, res) => {
  try {
    const { fileHash, fileName, collegeId } = req.body;

    if (!fileHash || !fileName || !collegeId) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const studentId = req.user.id;

    // ✅ Update certificate with college selection
    const updatedCertificate = await CertificateRequest.findOneAndUpdate(
        { fileHash, studentId },
        { collegeId, status: "Pending" },
        { new: true }
    );

    if (!updatedCertificate) {
        return res.status(404).json({ success: false, message: "Certificate not found" });
    }

    res.json({ success: true, message: "Verification request sent", certificate: updatedCertificate });

} catch (error) {
    console.error("Error in verification request:", error);
    res.status(500).json({ success: false, message: "Server error" });
}
});

router.put("/request/update/:id", verifyToken, async (req, res) => {
  try {
      const { id } = req.params;  // ✅ Get request ID from URL
      const { status } = req.body;

      if (!id || !status) {
          return res.status(400).json({ success: false, message: "Missing required fields" });
      }

      const updatedRequest = await CertificateRequest.findByIdAndUpdate(
          id,
          { status },
          { new: true }
      );

      if (!updatedRequest) {
          return res.status(404).json({ success: false, message: "Certificate request not found" });
      }

      res.json({ success: true, message: "Status updated successfully", request: updatedRequest });
  } catch (error) {
      console.error("❌ Error updating certificate status:", error);
      res.status(500).json({ success: false, message: "Server error" });
  }
});

// DELETE Certificate Route
router.delete("/delete/:id", async (req, res) => {
  try {
      const { id } = req.params;
      console.log("🛠 Deleting Certificate with ID:", id);

      if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ message: "Invalid certificate ID format" });
      }

      const deletedCertificate = await CertificateRequest.findByIdAndDelete(id);
      if (!deletedCertificate) {
          console.log("❌ Certificate not found in certificaterequests");
          return res.status(404).json({ message: "Certificate not found" });
      }

      console.log("✅ Certificate deleted successfully");
      res.json({ message: "Certificate deleted successfully" });
  } catch (error) {
      console.error("❌ Error deleting certificate:", error);
      res.status(500).json({ message: "Server error" });
  }
});

// ✅ QR Code Download Route
router.get("/qrcode/:certificateId", async (req, res) => {
  try {
      const { certificateId } = req.params;
      console.log("📌 Fetching QR Code for Certificate ID:", certificateId);

      // ✅ Fetch certificate from DB
      const certificate = await CertificateRequest.findOne({ certificateId });

      if (!certificate) {
          return res.status(404).json({ success: false, message: "Certificate not found" });
      }

      if (!certificate.qrCode) { // ✅ Ensure `qrCode` field is present
          console.error("❌ QR Code is missing in DB for:", certificateId);
          return res.status(404).json({ success: false, message: "QR Code not found for this certificate" });
      }

      // ✅ Fix the file path issue
      const qrCodePath = path.join(__dirname, "..", certificate.qrCode); // Use the correct relative path
      console.log("✅ Serving QR Code from:", qrCodePath);

      res.sendFile(qrCodePath);

  } catch (error) {
      console.error("❌ QR Code Fetch Error:", error);
      res.status(500).json({ success: false, message: "Server error" });
  }
});

// 1️⃣ Fetch Student Profile
router.get("/profile", verifyToken, async (req, res) => {
  try {
    const student = await Student.findOne({ _id: req.user.id }).select(
      "registerNo degree course batch"
    );
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json({ success: true, student }); // ✅ Ensure 'student' is sent
  } catch (error) {
    console.error("Error fetching student profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// 2️⃣ Update Student Profile
router.put("/update", verifyToken, async (req, res) => {
  try {
    const { registerNo, degree, course, batch } = req.body;

    const updatedStudent = await Student.findOneAndUpdate(
      { _id: req.user.id }, // Find student by ID from JWT
      { registerNo, degree, course, batch },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json({ message: "Profile Updated Successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/profile/:studentId", async (req, res) => {
  const { studentId } = req.params;

  if (!studentId) {
      return res.status(400).json({ success: false, message: "Student ID is required" });
  }

  try {
      const student = await Student.findById(studentId);
      if (!student) {
          return res.status(404).json({ success: false, message: "Student not found" });
      }
      res.json({ success: true, student });
  } catch (error) {
      console.error("Error fetching student profile:", error);
      res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;