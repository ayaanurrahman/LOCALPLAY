const mongoose = require("mongoose")

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["request_received", "request_accepted", "request_declined", "request_cancelled"],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    relatedRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayRequest"
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, { timestamps: true })

// index for fast lookup of unread notifications per user
notificationSchema.index({ recipient: 1, isRead: 1 })

const Notification = mongoose.model("Notification", notificationSchema)
module.exports = Notification
