const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const College = require("../models/College");
const Company = require("../models/Company"); // ✅ Added Company model
require("dotenv").config();

const verifyToken = async (req, res, next) => {
  let token = req.header("Authorization");

  if (!token) {
    return res.status(401).json({ success: false, message: "Access Denied! No Token Provided" });
  }

  try {
    // ✅ Extract token correctly (removing "Bearer " if present)
    token = token.startsWith("Bearer ") ? token.split(" ")[1] : token;

    // ✅ Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id) {
      return res.status(401).json({ success: false, message: "Invalid Token" });
    }

    // ✅ Check if the user is a student first
    let user = await Student.findById(decoded.id).select("-password");

    // ✅ If not a student, check if it's a college
    if (!user) {
      user = await College.findById(decoded.id).select("-password");
    }

    // ✅ If not a college, check if it's a company
    if (!user) {
      user = await Company.findById(decoded.id).select("-password");
    }

    // ✅ If no user is found (invalid token)
    if (!user) {
      return res.status(401).json({ success: false, message: "User Not Found" });
    }

    req.user = user; // ✅ Attach user details to request
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error);
    res.status(401).json({ success: false, message: "Invalid or Expired Token" });
  }
};

module.exports = { verifyToken };