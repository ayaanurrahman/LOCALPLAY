const userModel = require("../models/user.model")

// GET : /api/users/profile : get logged in user's full profile 
exports.getProfile = async(req,res) => {
    try {
        const user = req.user

        if(!user) {
            return res.status(404).json({
                "message" : "User not Found"
            })
        }

        res.status(200).json({user})
        
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors).map(val => val.message).join(", ")
            return res.status(400).json({ message })
        }
        res.status(500).json({
            "message": "Internal server error",
            error: error.message
        })
    }
}

// PUT : /api/users/profile : update logged in user's profile 
exports.updateProfile = async(req,res) =>{
    try {
        const {games, availability, preferredLocation, bio, location } = req.body

        // building update object with only the fields that were sent
        const updates = {}
        if (games) updates.games = games
        if (availability) updates.availability = availability
        if (preferredLocation) updates.preferredLocation = preferredLocation
        if (bio) updates.bio = bio
        if (location) updates.location = location

        // updating the user model (partially)
        const updatedUser = await userModel.findByIdAndUpdate(
            req.user._id,
            {$set: updates},
            {new: true, runValidators:true}
        ).select("-password")

        res.status(200).json({
            "message" : "User updated Successfully",
            user: updatedUser
        })
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors).map(val => val.message).join(", ")
            return res.status(400).json({ message })
        }
        res.status(500).json({
            "message": "Internal server error",
            error: error.message
        })
    }
}

// GET : /api/users/search : searching for players
exports.searchPlayers = async(req,res) =>{
    try {
        const {
            game,
            skillLevel,
            day,
            timeSlot,
            maxDistance = 5000,
            lng,
            lat,
            page = 1
        } = req.query

        // checking for lng lat 
        if(!lng || !lat) {
            return res.status(400).json({
                "message" : "Location coordinates are required for search"
            })
        }

        // capping the max distance at 50km 
        const MAX_DISTANCE = 50000
        const distance = Math.min(parseInt(maxDistance) || 5000, MAX_DISTANCE)

        // building the query dynamically 
        const query = {}

        // excluding the person who is searching
        query._id = {$ne: req.user._id}

        // filtration
        if (game && skillLevel) {
            query.games = { $elemMatch: { name: game, skillLevel: skillLevel } }
        } else if (game) {
            query["games.name"] = game
        }
        if (day) query["availability.days"] = day
        if (timeSlot) query["availability.timeSlot"] = timeSlot

        // geospatial filter — finding users within maxDistance meters
        // NOTE: $near cannot be used with countDocuments()
        // so we fetch all matching players first, then paginate in memory
        query.location = {
            $near : {
                $geometry: {
                    type: "Point",
                    coordinates : [parseFloat(lng), parseFloat(lat)]
                },
                $maxDistance : distance
            }
        }

        const LIMIT = 10
        const currentPage = parseInt(page)
        const skip = (currentPage - 1) * LIMIT

        // fetch all results first (required because $near blocks countDocuments)
        const allPlayers = await userModel.find(query).select("-password")

        // paginate in memory
        const total = allPlayers.length
        const players = allPlayers.slice(skip, skip + LIMIT)

        res.status(200).json({
            "message" : `${total} players found.`,
            players,
            total,
            page: currentPage,
            totalPages: Math.ceil(total / LIMIT) || 1
        })
    
    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors).map(val => val.message).join(", ")
            return res.status(400).json({ message })
        }
        res.status(500).json({
            "message": "Internal server error",
            error: error.message
        })
    }
}