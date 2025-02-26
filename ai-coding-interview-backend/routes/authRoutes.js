const express = require("express");
const { signupUser, loginUser, getProfile } = require("../controller/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/signup", signupUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getProfile); // Ensure getProfile is correctly passed as a function

module.exports = router;
