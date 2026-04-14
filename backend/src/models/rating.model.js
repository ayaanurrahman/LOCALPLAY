const mongoose = require("mongoose")

const ratingSchema = new mongoose.Schema({
    rater: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rated: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    playRequest: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PlayRequest",
        required: true
    },
    stars: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        maxlength: 300,
        trim: true
    }
}, { timestamps: true })

// one rating per user per match — can't rate the same match twice
ratingSchema.index({ rater: 1, playRequest: 1 }, { unique: true })

module.exports = mongoose.model("Rating", ratingSchema)