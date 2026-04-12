const mongoose = require("mongoose")

// creating user schema using mongoose 
const userSchema = new mongoose.Schema({
    // this contains user's name they want to be displayed 
    username : {
        type: String, 
        required: true,
        trim : true
    },
    // this is the unique field users will use to login through
    email : {
        type: String, 
        required: true,
        trim : true,
        unique:true,
        lowercase: true,
        // validating if the email is in correct format using regex
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    // password will be hashed and then stored 
    password : {
        type: String, 
        required: true
    },

    // this is the role, by default it will be a user
    // user can create and manage their own profile and can visit other's 
    // admin can manage everything, including every user's data
    role: {
        type:String, 
        enum: ["user", "admin"],
        default: "user"
    },
    isBanned: {
        type: Boolean,
        default: false
    },

    location: {
        type: {
            type: String,
            enum: ["Point"],

        },
        coordinates: {
            type: [Number], 
        },
        address: {
            type: String,
            trim: true
        }
    },

    games: [
            {
                name: {
                    type: String,
                    enum: ["chess", "carrom", "badminton", "table tennis", "cards", "cricket", "football"],
                    required: true
                },
                skillLevel: {
                    type: String,
                    enum: ["beginner", "intermediate", "advanced"],
                    required: true
                }
            }
        ],

    // availability[0] = Monday, [1] = Tuesday ... [6] = Sunday
    availability: {
        days: [{
            type: String,
            enum: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
        }],
        timeSlot: {
            type: String,
            enum: ["morning", "afternoon", "evening", "night"],
        }
    },

    preferredLocation: {
        type: String,
        enum: ["home", "society clubhouse", "local ground"],
    },

    bio: {
        type: String,
        maxlength: 200,
        trim: true
    }
}, {timestamps: true})

// Indexing Location for Geospatial Queries. This allows to use operators like $near and $geoWithin
userSchema.index({ location: "2dsphere" });

// creating user model 
const userModel = mongoose.model("User", userSchema)

// exporting user model 
module.exports = userModel