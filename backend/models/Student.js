const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  registerNo: { type: String, default:"" }, // ✅ Added Register Number
  degree: { type: String, default: "" }, // ✅ Added Degree Field
  course: { type: String, default: "" }, // ✅ Added Course Field
  batch: { type: String, default: "" }, // ✅ Added Batch Field
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Student", StudentSchema);
