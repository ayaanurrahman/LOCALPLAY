const express = require("express")
const router = express.Router()
const { getNotifications, markAsRead, markAllAsRead } = require("../controllers/notification.controller")
const { protect } = require("../middlewares/auth.middleware")

// all notification routes require login
router.get("/", protect, getNotifications)
router.put("/read-all", protect, markAllAsRead)
router.put("/:id/read", protect, markAsRead)

module.exports = router
