const Rating = require("../models/rating.model")
const playRequestModel = require("../models/playRequest.model")
const userModel = require("../models/user.model")

// POST /api/ratings — submit a rating after a match
exports.submitRating = async (req, res) => {
    try {
        const { playRequestId, stars, comment } = req.body

        if (!playRequestId || !stars) {
            return res.status(400).json({ message: "playRequestId and stars are required" })
        }

        if (stars < 1 || stars > 5) {
            return res.status(400).json({ message: "Stars must be between 1 and 5" })
        }

        const playRequest = await playRequestModel.findById(playRequestId)

        if (!playRequest) {
            return res.status(404).json({ message: "Match not found" })
        }

        // only accepted matches can be rated
        if (playRequest.status !== "accepted") {
            return res.status(400).json({ message: "You can only rate accepted matches" })
        }

        // only the two players involved can rate
        const senderId = playRequest.sender.toString()
        const receiverId = playRequest.receiver.toString()
        const myId = req.user._id.toString()

        if (myId !== senderId && myId !== receiverId) {
            return res.status(403).json({ message: "You were not part of this match" })
        }

        // the person being rated is the other player
        const ratedId = myId === senderId ? receiverId : senderId

        // only rate after proposedTime has passed
        if (new Date(playRequest.proposedTime) > new Date()) {
            return res.status(400).json({ message: "You can only rate after the match time has passed" })
        }

        // create the rating
        const rating = await Rating.create({
            rater: myId,
            rated: ratedId,
            playRequest: playRequestId,
            stars,
            comment
        })

        // recalculate and update the rated user's avgRating and matchesPlayed
        const allRatings = await Rating.find({ rated: ratedId })
        const avg = allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length

        await userModel.findByIdAndUpdate(ratedId, {
            avgRating: Math.round(avg * 10) / 10, // round to 1 decimal
            matchesPlayed: allRatings.length
        })

        res.status(201).json({ message: "Rating submitted successfully", rating })

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "You have already rated this match" })
        }
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// GET /api/ratings/:userId — get all ratings for a user's profile
exports.getUserRatings = async (req, res) => {
    try {
        const ratings = await Rating.find({ rated: req.params.userId })
            .populate("rater", "username")
            .populate("playRequest", "game proposedTime")
            .sort({ createdAt: -1 })
            .limit(20)

        res.status(200).json({ ratings })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// GET /api/ratings/check/:playRequestId — check if logged-in user has already rated this match
exports.checkRating = async (req, res) => {
    try {
        const existing = await Rating.findOne({
            rater: req.user._id,
            playRequest: req.params.playRequestId
        })
        res.status(200).json({ hasRated: !!existing, rating: existing || null })
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}