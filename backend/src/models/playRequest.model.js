const mongoose = require("mongoose")
const playRequestSchema = new mongoose.Schema({

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    game: {
        type: String,
        enum: ["chess", "carrom", "badminton", "table tennis", "cards", "cricket", "football"],
        required: true
    },

    location: {
        type: String,
        enum: ["home", "society clubhouse", "local ground"],
        required: true
    },

    proposedTime: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "accepted", "declined", "cancelled"],
        default: "pending"
    },

    // optional message from sender
    message: {
        type: String,
        maxlength: 300,
        trim: true
    },
    flagged: {
        type: Boolean,
        default: false
    },

    flagReason: {
        type: String,
        trim: true,
        maxlength: 500
    }

}, { timestamps: true })

// prevents duplicate pending requests for the same game between same two users
// a user CAN send requests for different games to the same person
playRequestSchema.index(
    { sender: 1, receiver: 1, game: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: { status: "pending" }
    }
)

const playRequestModel = mongoose.model("PlayRequest", playRequestSchema)

module.exports = playRequestModel