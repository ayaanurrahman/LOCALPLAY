const userModel = require("../models/user.model")
const playRequestModel = require("../models/playRequest.model")

// GET /api/admin/users — get all users
exports.getAllUsers = async (req,res) =>{
    try {
        const { page = 1 } = req.query
        const LIMIT = 50
        const skip = (parseInt(page) - 1) * LIMIT

        // getting all the users and their details except password. latest user created comes first
        const [users, total] = await Promise.all([
            userModel.find().select("-password").sort({ createdAt: -1 }).skip(skip).limit(LIMIT),
            userModel.countDocuments()
        ])

        res.status(200).json({
            "message" : `${total} user(s) found`,
            users,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / LIMIT)
        })
    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}

// GET /api/admin/users/:id — get a specific user's full details
exports.getUserById = async(req,res) =>{

    try {
        const userId = req.params.id
        const user = await userModel.findById(userId).select("-password")

        if(!user) {
            return res.status(404).json({
                "message" : "User not found"
            })
        }

        res.status(200).json({user})

    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}

// PUT /api/admin/users/:id/ban — ban or unban a user
exports.toggleBanUser = async (req,res) =>{
    try {
        const userId = req.params.id

        // finding the user 
        const user = await userModel.findById(userId)

        // checking for user 
        if(!user) {
            return res.status(404).json({
                "message" : "User not found."
            })
        }

        // preventing admin from banning themselves 
        if (user._id.toString() === req.user._id.toString()){
            return res.status(400).json({
                "message" : "You can not ban yourself"
            }) 
        }

        // prevent banning other admins 
        if(user.role === "admin" ) {
            return res.status(400).json({
                "message" :"You cannot ban an admin"
            })
        }

        // updating and saving the user  
        user.isBanned = !user.isBanned
        await user.save()

        res.status(200).json({
            "message" : `user ${user.isBanned ? "banned" : "unbanned"} successfully.`
        })

    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}

// DELETE /api/admin/users/:id — permanently delete a user
exports.deleteUser = async (req,res) =>{
    try {
        const userId  = req.params.id
        const user = await userModel.findById(userId)

        // checking for the user 
        if(!user) {
            return res.status(404).json({
                "message" : "User not found."
            })
        }

        // preventing admin from deleting themselves
        if(user._id.toString() === req.user._id.toString()){
            return res.status(400).json({
                "message" : "You can not delete yourself"
            })
        }

        // preventing admin to delete other admins 
        if(user.role === "admin"){
            return res.status(400).json({
                "message" : "You can not delete other admins."
            })
        }

        // deleting the user 
        await userModel.findByIdAndDelete(userId)

        // deleting their play requests. either sent or received 
        await playRequestModel.deleteMany({
            $or : [{sender : userId}, {receiver : userId}]
        })

        res.status(200).json({
            "message" : "User and their play requests deleted successfully"
        })
        
    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}

// GET /api/admin/requests — get all play requests on the platform
exports.getAllRequests = async(req,res) =>{
    try {
        // getting the status from the query string (url) | "pending" , "accepted" , "declined"
        const {status} = req.query

        // creating a filter object  filter : {status}
        const filter = {}

        // checking for status and storing it in the filter object 
        if (status) filter.status = status

        // finding requests new -> old
        const requests = await playRequestModel
            .find(filter)
            .populate("sender", "username email")
            .populate("receiver", "username email")
            .sort({ createdAt: -1 })

        res.status(200).json({
            "message": `${requests.length} request(s) found`,
            requests
        })
    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}

// GET /api/admin/stats — platform activity overview
exports.getPlatformStats = async(req,res) =>{
    try {

        // used promise.all instead of await so every request runs in parallel instead of completing one by one which will eventually take a lot of time  
       const [
            totalUsers,
            bannedUsers,
            totalRequests,
            pendingRequests,
            acceptedRequests,
            declinedRequests,
            cancelledRequests
        ] = await Promise.all([
            userModel.countDocuments(),
            userModel.countDocuments({ isBanned: true }),
            playRequestModel.countDocuments(),
            playRequestModel.countDocuments({ status: "pending" }),
            playRequestModel.countDocuments({ status: "accepted" }),
            playRequestModel.countDocuments({ status: "declined" }),
            playRequestModel.countDocuments({ status: "cancelled" })
        ])
        
        // most popular games across all users
        const gameStats = await userModel.aggregate([
            { $unwind: "$games" }, //if user1 plays both chess and cricket, $unwind will create 2 virtual user1 one for cricket and one for chess
            { $group: { _id: "$games.name", count: { $sum: 1 } } }, //it will add 1 for every user into separate piles based on the game
            { $sort: { count: -1 } } // puts the biggest pile at the top
        ])
        
        // sending the response
        res.status(200).json({
            users: {
                total: totalUsers,
                banned: bannedUsers,
                active: totalUsers - bannedUsers
            },
            requests: {
                total: totalRequests,
                pending: pendingRequests,
                accepted: acceptedRequests,
                declined: declinedRequests,
                cancelled: cancelledRequests,
                successRate: totalRequests > 0
                    ? ((acceptedRequests / totalRequests) * 100).toFixed(1) + "%"
                    : "0%"
            }, // calculates the success rate of the whole app (all users)
            popularGames: gameStats
        })

    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}

// POST /api/admin/reports/:requestId — flag a play request for misuse
exports.flagRequest = async(req,res) =>{
    try {
        const {reason } = req.body
        // checking for reason 
        if(!reason) {
            return res.status(400).json({
                "message" : "Reason is required to flag a message"
            })
        }

        const playRequestId = req.params.requestId

        // finding the request 
        const playRequest = await playRequestModel.findById(playRequestId)

        // checking if the play request exists 
        if(!playRequest){
            return res.status(404).json({
                "message" : "No request found"
            })
        }

        // storing flagged condition and reason and saving the document  
        playRequest.flagged = true
        playRequest.flagReason = reason 
        await playRequest.save()

        res.status(200).json({
            "message" : "PLay request flagged"
        })


    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}