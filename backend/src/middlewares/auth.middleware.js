const jwt = require("jsonwebtoken")
const userModel = require("../models/user.model")

const protect = async (req,res, next) =>{
    try {

        // extracting the token from req.cookies 
        const token = req.cookies.token

        // checking for token 
        if(!token) {
            return res.status(401).json({
                "message" : "Please Log In again"
            })
        }

        // if token is present decode it via jwt and verify the user id 
        const decodedToken = jwt.verify(token , process.env.JWT_SECRET)

        // finding the user by id that we got in decoded token
        req.user = await userModel.findById(decodedToken.id).select("-password")

        // checking if the user is banned
        if (req.user && req.user.isBanned) {
            return res.status(403).json({
                "message": "Your account has been banned. Please contact support."
            })
        }

        // calling the next function 
        next()

    } catch (error) {
        res.status(401).json({
            "message" : "Invalid or expired token. Please log in again.",
            error: error.message
        })
    }
}

module.exports = {protect}