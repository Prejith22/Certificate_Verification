const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const College = require("../models/College");
const Company = require("../models/Company");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key"; // Use env variable

// 🔵 Generate JWT Token
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, JWT_SECRET, { expiresIn: "1d" });
};

/* ========================================================= */
/* ✅ STUDENT REGISTRATION & LOGIN */
/* ========================================================= */

// 🟢 Register Student
router.post("/register/student", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ❌ Check if all fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // ❌ Check if the student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // ✅ Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // ✅ Create Student
    const student = new Student({
      name,
      email,
      password: hashedPassword, // Storing hashed password
    });

    await student.save();

    // ✅ Generate JWT Token
    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.status(201).json({
      success: true,
      message: "Student registered successfully",
      token,
      student,
    });
  } catch (error) {
    console.error("❌ Registration Error:", error); // Log full error
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// 🟢 Student Login
router.post("/login/student", async (req, res) => {
  try {
    const { email, password } = req.body;
    const student = await Student.findOne({ email });

    if (!student || !(await bcrypt.compare(password, student.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(student._id, "student");
    res.json({ token, role: "student" });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ========================================================= */
/* ✅ COLLEGE REGISTRATION & LOGIN */
/* ========================================================= */

// 🔵 Register College
router.post("/register/college", async (req, res) => {
  try {
    const { universityName, email, password } = req.body;

    // Check if college already exists
    const existingCollege = await College.findOne({ email });
    if (existingCollege) return res.status(400).json({ message: "College already registered" });

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create College
    const college = await College.create({ name: universityName, email, password: hashedPassword });

    res.status(201).json({ message: "College registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// 🔵 College Login
router.post("/login/college", async (req, res) => {
  try {
    const { email, password } = req.body;
    const college = await College.findOne({ email });

    if (!college || !(await bcrypt.compare(password, college.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(college._id, "college");
    res.json({ token, role: "college" });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

/* ========================================================= */
/* ✅ COMPANY REGISTRATION & LOGIN */
/* ========================================================= */

// 🟠 Register Company
router.post("/register/company", async (req, res) => {
  try {
    const { companyName, email, password } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });
    if (existingCompany) return res.status(400).json({ message: "Company already registered" });

    // Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Company
    const company = await Company.create({ name: companyName, email, password: hashedPassword });

    res.status(201).json({ message: "Company registered successfully" });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
});

// 🟠 Company Login
router.post("/login/company", async (req, res) => {
  try {
    const { email, password } = req.body;
    const company = await Company.findOne({ email });

    if (!company || !(await bcrypt.compare(password, company.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(company._id, "company");
    res.json({ token, role: "company" });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

module.exports = router;
