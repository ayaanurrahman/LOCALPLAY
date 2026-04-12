// requiring mongoose to connect to the data base 
const mongoose = require("mongoose")

const connectToTheDatabase = () =>{
    // connecting to the database 
    mongoose.connect(process.env.MONGO_URI, {sanitizeFilter: true})
    .then(() => {
        console.log("connection to the database : successful")
    })

    // checking and catching errors 
    .catch((err) => {
        console.log("connection to the database : failed", err.message)
        process.exit(1) // shuts the server down if DB is not connected 
    }) 
}

// exporting the function 
module.exports = connectToTheDatabase