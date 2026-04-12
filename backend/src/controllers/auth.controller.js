// This file contains the logic of login and register

const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

// helper function to generate jwt token 
const generateToken = (userId) =>{
    // this func returns a jwt token, containing userId, secret key and expiration time 
    return jwt.sign({id: userId}, process.env.JWT_SECRET, {expiresIn:"7d"})
}

// defining cookie options 
const cookieOptions = {
            httpOnly: true,  
            secure: process.env.NODE_ENV === 'production', 
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
}

// POST : /api/auth/register : registering the user 
exports.register = async(req,res) =>{
    try {
        const {username, email, password } = req.body

        // checking for missing fields
        if (!username || !email || !password){
            return res.status(400).json({"message" : "All fields are required"})
        }

        // validating password strength BEFORE hashing
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
        if (password.length < 8 || !passwordRegex.test(password)) {
            return res.status(400).json({
                "message": "Password must be at least 8 characters and contain one uppercase letter, one lowercase letter, and one number"
            })
        }

        // checking if the user already exits 
        const userExists = await userModel.findOne({email})
        if(userExists) {
            return res.status(400).json({"message": "Email already registered"})
        }
        
        // hashing the password 
        const hashedPassword = await bcrypt.hash(password, 10)
        // creating the user
        const user = await userModel.create({
            username, email, password: hashedPassword
        })

        // generating the token 
        const token = generateToken(user._id)

        // storing token in cookie 
        res.cookie('token', token, cookieOptions ).status(201).json({
            "message" : "registration successful",
            user: {username: user.username , email: user.email, id: user._id}
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

// POST : /api/auth/login : logging in the user
exports.login = async(req,res) =>{

    try {
        // checking if the token is already present 
        const tokenPresent = req.cookies.token
        
        if(tokenPresent){
            return res.status(200).json({
                "message" : "User already logged In"
            })
        }
        // extracting log in data from body 
        const {email, password} = req.body

        // checking if email and password exits 
        if(!email || !password) {
            return res.status(400).json({
                "message" : "All fields are required"
            })
        }

        // checking for the user  
        const user = await userModel.findOne({email})
        if(!user) {
            return res.status(400).json({
                "message" : "Invalid email or password"
            })
        }

        // checking if the password matches 
        const passMatches = await bcrypt.compare(password, user.password)

        // if password doesn't match 
        if(!passMatches) {
            return res.status(400).json({
                "message" : "Invalid email or password"
            })
        }

        // generating the token if password matches 
        const token = generateToken(user._id)

        // storing the token into the cookie 
        res.cookie("token", token, cookieOptions).status(200).json({
            "message" : "User Login successful",
            user: {username: user.username, email: user.email,  id: user._id,} 
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

// POST : /api/auth/logout : logging out the user
exports.logout = (req,res) =>{
    // clearing the cookie will automatically log out the user  
    res.clearCookie("token").status(200).json({
    "message" : "User Logged out successfully"
    })
}