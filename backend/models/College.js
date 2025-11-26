const mongoose = require("mongoose");

const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // University name
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed password stored here
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.College || mongoose.model("College", CollegeSchema);
