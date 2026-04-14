let io = null

// called once from server.js after io is created
const initSocket = (socketIo) => {
    io = socketIo

    io.on("connection", (socket) => {
        // client sends their userId so we can put them in a personal room
        // this means we can emit directly to a specific user with io.to(userId)
        socket.on("join", (userId) => {
            if (userId) {
                socket.join(userId)
                console.log(`Socket ${socket.id} joined room: ${userId}`)
            }
        })

        socket.on("disconnect", () => {
            console.log(`Socket disconnected: ${socket.id}`)
        })
    })
}

// used by controllers to emit events to specific users
const getIo = () => {
    if (!io) throw new Error("Socket.io not initialised")
    return io
}

module.exports = { initSocket, getIo }
