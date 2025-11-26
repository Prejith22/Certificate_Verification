const express = require("express");
const router = express.Router();
const College = require("../models/College"); // Make sure the College model exists

// Fetch all registered colleges
router.get("/colleges", async (req, res) => {
  try {
    const colleges = await College.find(); // Get all colleges from DB
    res.json(colleges);
  } catch (err) {
    res.status(500).json({ message: "Error fetching colleges" });
  }
});

module.exports = router;
