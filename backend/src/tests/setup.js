const { MongoMemoryServer } = require('mongodb-memory-server')
const mongoose = require('mongoose')

let mongoServer

// runs once before all tests — starts in-memory MongoDB
beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create()
    const uri = mongoServer.getUri()
    await mongoose.connect(uri)
})

// runs after each test — wipes all collections so tests don't bleed into each other
afterEach(async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
})

// runs once after all tests — closes connection and stops server
afterAll(async () => {
    await mongoose.disconnect()
    await mongoServer.stop()
})