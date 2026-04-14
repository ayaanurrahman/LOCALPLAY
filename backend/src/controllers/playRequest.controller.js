const playRequestModel = require("../models/playRequest.model")
const userModel = require("../models/user.model")
const Notification = require("../models/notification.model")
const { getIo } = require("../socket")

// helper: create a notification in DB and emit it via socket to the recipient
const notify = async (recipientId, type, message, requestId) => {
    try {
        const notification = await Notification.create({
            recipient: recipientId,
            type,
            message,
            relatedRequest: requestId
        })

        // emit to the recipient's personal room (they joined with their userId)
        getIo().to(recipientId.toString()).emit("notification", {
            _id: notification._id,
            type,
            message,
            relatedRequest: requestId,
            isRead: false,
            createdAt: notification.createdAt
        })
    } catch (err) {
        // notification failure should never break the main action
        console.error("Notification error:", err.message)
    }
}

// POST /api/requests/send
exports.sendRequest = async (req, res) => {
    try {
        const { receiverId, game, location, proposedTime, message } = req.body

        if (!receiverId || !game || !location || !proposedTime) {
            return res.status(400).json({ message: "receiverId, game, location and proposedTime are required" })
        }

        // unverified users cannot send play requests
        if (!req.user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before sending play requests." })
        }

        if (req.user._id.toString() === receiverId) {
            return res.status(400).json({ message: "You cannot send a play request to yourself" })
        }

        const receiver = await userModel.findById(receiverId)
        if (!receiver) {
            return res.status(404).json({ message: "User not found" })
        }

        const receiverPlaysGame = receiver.games.some(g => g.name === game)
        if (!receiverPlaysGame) {
            return res.status(400).json({ message: `${receiver.username} does not play ${game}` })
        }

        if (new Date(proposedTime) <= new Date()) {
            return res.status(400).json({ message: "Proposed time must be in the future" })
        }

        const playRequest = await playRequestModel.create({
            sender: req.user._id,
            receiver: receiverId,
            game,
            location,
            proposedTime,
            message
        })

        // notify the receiver
        await notify(
            receiverId,
            "request_received",
            `${req.user.username} sent you a play request for ${game}`,
            playRequest._id
        )

        res.status(201).json({ message: "Play request sent successfully", playRequest })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "You already have a pending request to this player for this game" })
        }
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors).map(val => val.message).join(", ")
            return res.status(400).json({ message })
        }
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// GET /api/requests/incoming
exports.getIncomingRequests = async (req, res) => {
    try {
        const requests = await playRequestModel
            .find({ receiver: req.user._id })
            .populate("sender", "username email location games")
            .sort({ createdAt: -1 })

        res.status(200).json({ message: `${requests.length} incoming request(s)`, requests })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// GET /api/requests/outgoing
exports.getOutgoingRequests = async (req, res) => {
    try {
        const requests = await playRequestModel
            .find({ sender: req.user._id })
            .populate("receiver", "username email location games")
            .sort({ createdAt: -1 })

        res.status(200).json({ message: `${requests.length} outgoing request(s)`, requests })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// PUT /api/requests/:id/respond
exports.respondToRequest = async (req, res) => {
    try {
        const { status } = req.body

        if (!["accepted", "declined"].includes(status)) {
            return res.status(400).json({ message: "Status must be accepted or declined" })
        }

        const playRequest = await playRequestModel.findById(req.params.id)

        if (!playRequest) {
            return res.status(404).json({ message: "Play request not found" })
        }
        if (playRequest.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to respond to this request" })
        }
        if (playRequest.status !== "pending") {
            return res.status(400).json({ message: `Request is already ${playRequest.status}` })
        }

        playRequest.status = status
        await playRequest.save()

        // notify the sender about the response
        const notifMessage = status === "accepted"
            ? `${req.user.username} accepted your play request for ${playRequest.game} 🎉`
            : `${req.user.username} declined your play request for ${playRequest.game}`

        await notify(
            playRequest.sender,
            status === "accepted" ? "request_accepted" : "request_declined",
            notifMessage,
            playRequest._id
        )

        res.status(200).json({ message: `Request ${status} successfully`, playRequest })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// PUT /api/requests/:id/cancel
exports.cancelRequest = async (req, res) => {
    try {
        const playRequest = await playRequestModel.findById(req.params.id)

        if (!playRequest) {
            return res.status(404).json({ message: "Play request not found" })
        }
        if (playRequest.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You are not authorized to cancel this request" })
        }
        if (playRequest.status !== "pending") {
            return res.status(400).json({ message: `Cannot cancel a request that is already ${playRequest.status}` })
        }

        playRequest.status = "cancelled"
        await playRequest.save()

        // notify the receiver that the request was cancelled
        await notify(
            playRequest.receiver,
            "request_cancelled",
            `${req.user.username} cancelled their play request for ${playRequest.game}`,
            playRequest._id
        )

        res.status(200).json({ message: "Request cancelled successfully", playRequest })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// GET /api/requests/history
exports.getMatchHistory = async (req, res) => {
    try {
        const history = await playRequestModel
            .find({
                $or: [{ sender: req.user._id }, { receiver: req.user._id }],
                status: "accepted"
            })
            .populate("sender", "username email")
            .populate("receiver", "username email")
            .sort({ createdAt: -1 })

        res.status(200).json({ message: `${history.length} match(es) found`, history })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}
