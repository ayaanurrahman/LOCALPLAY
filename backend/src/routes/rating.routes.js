const express = require("express")
const router = express.Router()
const { submitRating, getUserRatings, checkRating } = require("../controllers/rating.controller")
const { protect } = require("../middlewares/auth.middleware")

router.post("/", protect, submitRating)
router.get("/check/:playRequestId", protect, checkRating)
router.get("/:userId", getUserRatings)

module.exports = router