require("dotenv").config()

const http = require("http")
const { Server } = require("socket.io")
const app = require("./src/app")
const connectToTheDatabase = require("./src/config/database.config")
const { initSocket } = require("./src/socket")

// create HTTP server from express app
const server = http.createServer(app)

// attach Socket.io to the HTTP server
const io = new Server(server, {
    cors: {
        origin: [
            process.env.CLIENT_URL,
            'https://localplay-three.vercel.app',
            'https://localplay-git-main-ayaanurrahman.vercel.app'
        ],
        credentials: true
    }
})

// make io available to controllers via the initSocket helper
initSocket(io)

connectToTheDatabase()

server.listen(process.env.PORT, () => {
    console.log("server successfully running on port:", process.env.PORT)
})
