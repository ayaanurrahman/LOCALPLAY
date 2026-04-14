// this is a lightweight version of app.js for testing
// it does NOT call app.listen() or connectToDatabase()
// the test setup handles the DB connection via MongoMemoryServer
// set env vars for tests before any module loads
process.env.JWT_SECRET = 'test-secret-key'
process.env.NODE_ENV = 'test'
// Email noise in test output, Mock the email utility in testApp.js so it never actually tries to connect to SMTP:
jest.mock('../utils/email.utils', () => ({
    sendVerificationEmail: jest.fn().mockResolvedValue(true)
}))

jest.mock('../socket', () => ({
    getIo: () => ({
        to: () => ({ emit: () => {} })
    })
})) 
const express = require('express')
const cookieParser = require('cookie-parser')
const cors = require('cors')

const authRoutes = require('../routes/auth.routes')
const userRoutes = require('../routes/user.routes')
const playRequestRoutes = require('../routes/playRequest.routes')
const notificationRoutes = require('../routes/notification.routes')

// mock socket.js so controllers don't crash when getIo() is called
// in tests we don't need real socket emissions
jest.mock('../socket', () => ({
    getIo: () => ({
        to: () => ({ emit: () => {} })
    })
}))

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/requests', playRequestRoutes)
app.use('/api/notifications', notificationRoutes)

module.exports = app   