require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const { ethers } = require("ethers");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Import Routes
const authRoutes = require("./routes/authRoutes");
const collegeRoutes = require("./routes/collegeRoutes");
const certificateRoutes = require("./routes/certificateRoutes");
const CertificateRequest = require("../backend/models/CertificateRequest");

// ✅ Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/college", collegeRoutes);
app.use("/api/certificate", certificateRoutes);
app.use("/api/Request",CertificateRequest);
const path = require("path");
// ✅ Serve static files correctly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));


app.get("/test", (req, res) => {
    res.send("✅ Backend is running!");
});

// ✅ Load MongoDB URI from .env
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
    console.error("❌ Error: MONGO_URI is not defined in .env file");
    process.exit(1);
}

// ✅ MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch((err) => {
        console.error("❌ MongoDB Connection Error:", err);
        process.exit(1);
    });

// ✅ Blockchain Configuration
let contract;
try {
    const contractData = require("D:/PROJECT/blockchain/artifacts/contracts/CertificateVerification.sol/CertificateVerification.json");
    const contractABI = contractData.abi;
    const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";  // Replace with deployed contract address

    const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545"); // Local Hardhat RPC
    const wallet = new ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);

    contract = new ethers.Contract(contractAddress, contractABI, wallet);
    console.log("✅ Blockchain Contract Loaded");
} catch (error) {
    console.error("❌ Blockchain Contract Error:", error.message);
}
// ✅ Issue Certificate on Blockchain
app.post('/api/blockchain/issue', async (req, res) => {
    const { studentName, course, university } = req.body;
    if (!contract) return res.status(500).json({ success: false, error: "Blockchain contract not initialized" });

    try {
        const tx = await contract.issueCertificate(studentName, course, university);
        await tx.wait();
        res.json({ success: true, message: "✅ Certificate Issued!" });
    } catch (error) {
        console.error("❌ Blockchain Issue Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ Verify Certificate on Blockchain
app.get('/api/blockchain/verify/:certHash', async (req, res) => {
    if (!contract) return res.status(500).json({ success: false, error: "Blockchain contract not initialized" });

    try {
        const cert = await contract.verifyCertificate(req.params.certHash);
        res.json({
            studentName: cert[0],
            course: cert[1],
            university: cert[2],
            issueDate: cert[3],
            isValid: cert[4],
        });
    } catch (error) {
        console.error("❌ Blockchain Verify Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

// ✅ Debug: Log Registered Routes
console.log("✅ Registered API Routes:");
app._router.stack.forEach((r) => {
    if (r.route && r.route.path) {
        console.log(r.route.path);
    }
});
