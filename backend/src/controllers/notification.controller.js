const Notification = require("../models/notification.model")

// GET /api/notifications — get all notifications for logged-in user (newest first)
exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .sort({ createdAt: -1 })
            .limit(30)

        const unreadCount = await Notification.countDocuments({
            recipient: req.user._id,
            isRead: false
        })

        res.status(200).json({ notifications, unreadCount })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// PUT /api/notifications/:id/read — mark one notification as read
exports.markAsRead = async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true }
        )
        res.status(200).json({ message: "Marked as read" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// PUT /api/notifications/read-all — mark all notifications as read
exports.markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { isRead: true }
        )
        res.status(200).json({ message: "All notifications marked as read" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}
