const express = require("express");
const router = express.Router();

const { registerUser, loginUser } = require("../controllers/authController");

// Student Registration
router.post("/register", registerUser);

// Student Login
router.post("/login", loginUser);

module.exports = router;