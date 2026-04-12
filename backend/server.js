// requiring dotenv module to use environment variables 
require("dotenv").config()

// requiring app 
const app = require("./src/app")

// importing function to connect the database 
const connectToTheDatabase = require("./src/config/database.config")

// connecting the database to the server
connectToTheDatabase()

// listening to the server on server port 
app.listen(process.env.PORT, () =>{
    console.log("server successfully running on port: ", process.env.PORT)
}) 
