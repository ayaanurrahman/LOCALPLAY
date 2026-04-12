const playRequestModel = require("../models/playRequest.model")
const userModel = require("../models/user.model")

// POST : /api/requests/send : sending a play request 
exports.sendRequest = async(req,res) =>{
    try {
        const { receiverId, game, location, proposedTime, message } = req.body

        // checking if all the fields are present except message (optional)
        if (!receiverId || !game || !location || !proposedTime) {
            return res.status(400).json({ "message": "receiverId, game, location and proposedTime are required" })
        }

        // user cant send the request to themselves
        if (req.user._id.toString() === receiverId) {
            return res.status(400).json({ "message": "You cannot send a play request to yourself" })
        }

        // checking if receiver exists
        const receiver = await userModel.findById(receiverId)
        if (!receiver) {
            return res.status(404).json({ "message": "User not found" })
        }


         // checking if receiver actually plays this game
        const receiverPlaysGame = receiver.games.some(g => g.name === game)
        if (!receiverPlaysGame) {
            return res.status(400).json({ "message": `${receiver.username} does not play ${game}` })
        }

        // checking if the proposedTime is in the future
        if (new Date(proposedTime) <= new Date()) {
            return res.status(400).json({ "message": "Proposed time must be in the future" })
        }
        
        // creating the play request 
        const playRequest = await playRequestModel.create({
            sender: req.user._id,
            receiver: receiverId,
            game,
            location,
            proposedTime,
            message
        })

        res.status(201).json({
            "message": "Play request sent successfully",
            playRequest
        })



    } catch (error) {
    if (error.code === 11000) {
        return res.status(400).json({
            "message": "You already have a pending request to this player for this game"
        })
    }
    
    if (error.name === "ValidationError") {
        const message = Object.values(error.errors).map(val => val.message).join(", ")
        return res.status(400).json({ message })
    }
    res.status(500).json({ "message": "Internal server error", error: error.message })
}
}

// GET /api/requests/incoming — requests received by logged in user
exports.getIncomingRequests = async (req,res) =>{
    try {

        // finding requests sent to the user
        const requests = await playRequestModel
            .find({ receiver: req.user._id })
            .populate("sender", "username email location games")
            .sort({ createdAt: -1 }) // newest first

        res.status(200).json({
            "message": `${requests.length} incoming request(s)`,
            requests
        })
        
    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}

// GET /api/requests/outgoing — requests sent by logged in user
exports.getOutgoingRequests = async(req,res) =>{
    try {

        // finding requests sent by the user
        const requests = await playRequestModel
            .find({ sender: req.user._id })
            .populate("receiver", "username email location games")
            .sort({ createdAt: -1 }) // newest first

        res.status(200).json({
            "message": `${requests.length} outgoing request(s)`,
            requests
        })
        
    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}

// PUT /api/requests/:id/respond — accept or decline an incoming request
exports.respondToRequest = async (req,res) =>{
    try {

        const {status} = req.body

        // only these two are valid responses
        if (!["accepted", "declined"].includes(status)) {
            return res.status(400).json({ "message": "Status must be accepted or declined" })
        }

        // finding the play request 
        const playRequest = await playRequestModel.findById(req.params.id)

        // checking for playRequest 
        if (!playRequest) {
            return res.status(404).json({ "message": "Play request not found" })
        }

        // only the receiver can respond
        if (playRequest.receiver.toString() !== req.user._id.toString()) {
            return res.status(403).json({ "message": "You are not authorized to respond to this request" })
        }

        // can only respond to pending requests
        if (playRequest.status !== "pending") {
            return res.status(400).json({ "message": `Request is already ${playRequest.status}` })
        }

        // setting the playRequest status to the sent status 
        playRequest.status = status
        await playRequest.save()

        res.status(200).json({
            "message": `Request ${status} successfully`,
            playRequest
        })
    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }   
}

// PUT /api/requests/:id/cancel — sender cancels their own pending request
exports.cancelRequest = async(req,res) =>{
    try {
        // finding the play request to cancel it by its id 
        const playRequest = await playRequestModel.findById(req.params.id)

        // checking for play request 
        if (!playRequest) {
            return res.status(404).json({ "message": "Play request not found" })
        }

        // can only be canceled by the sender 
        if (playRequest.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ "message": "You are not authorized to cancel this request" })
        }

        // can only cancel pending requests
        if (playRequest.status !== "pending") {
            return res.status(400).json({ "message": `Cannot cancel a request that is already ${playRequest.status}` })
        }

        // updating playRequest
        playRequest.status = "cancelled"
        await playRequest.save()

        res.status(200).json({
            "message": "Request cancelled successfully",
            playRequest
        })


    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }  
}

// GET /api/requests/history — all accepted matches for the logged in user
exports.getMatchHistory = async (req,res) =>{
    try {

        // finding only those requests in which either the sender is user or the receiver is user. In both cases the status should be accepted 
         const history = await playRequestModel
         .find({
                $or: [{ sender: req.user._id }, { receiver: req.user._id }],
                status: "accepted"
            })
            .populate("sender", "username email")
            .populate("receiver", "username email")
            .sort({ createdAt: -1 })

            res.status(200).json({
            "message": `${history.length} match(es) found`,
            history
        })

    } catch (error) {
        res.status(500).json({ "message": "Internal server error", error: error.message })
    }
}
