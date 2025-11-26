const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid'); // ✅ Correct way

const CertificateRequestSchema = new mongoose.Schema({
    certificateId: {
        type: String,
        default: uuidv4, // ✅ Automatically generate a unique ID for each certificate
        unique: true,
    },
    studentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
        required: true, 
    },
    studentName: {
        type: String,
        required: false,
    },
    fileName: {
        type: String,
        required: true,
    },
    fileUrl: {
        type: String,
        required: true,
    },
    fileHash: {
        type: String,
        required: true,
    },
    qrCode: {
        type: String, // ✅ Stores QR Code Data URL
        required: true
    },
    collegeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "College",
        required: false, // ✅ Optional (students upload first, select later)
    },
    status: {
        type: String,
        enum: ["Pending", "Approved", "Rejected", "Verified"], // ✅ Added "Verified" for blockchain confirmation
        default: "Pending",
    },
    blockchainTxHash: {
        type: String, // ✅ Stores Blockchain Transaction Hash
        required: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("CertificateRequest", CertificateRequestSchema);
