const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const authRoutes = require("./routes/auth.routes")
const userRoutes = require("./routes/user.routes")
const playRequestRoutes = require("./routes/playRequest.routes")
const adminRoutes = require("./routes/admin.routes")
const swaggerUi = require("swagger-ui-express")
const swaggerSpec = require("./config/swagger.config")
const path = require("path")

// security modules 
const helmet = require("helmet")
const rateLimit = require("express-rate-limit")

// initializing express server 
const app = express()

// middlewares 

// --- SECURITY MIDDLEWARE ---

// sets secure HTTP headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https://validator.swagger.io"]
        }
    }
}))
// enabling to get json as data 
app.use(express.json({ limit: "10kb" })) // limit body size — prevents large payload attacks


// general rate limiter — all routes
// max 100 requests per IP per 15 minutes
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        "message": "Too many requests from this IP, please try again after 15 minutes"
    },
    standardHeaders: true,  // sends rate limit info in response headers
    legacyHeaders: false
})

// strict rate limiter — auth routes only
// max 10 requests per IP per 15 minutes
// prevents brute force attacks on login/register
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        "message": "Too many login attempts from this IP, please try again after 15 minutes"
    },
    standardHeaders: true,
    legacyHeaders: false
})

app.use(generalLimiter)

// enabling the use of static folders
app.use(express.static("./public"))
// using cors to disable cors policy 
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}))
// using cookie parser to store jwt token 
app.use(cookieParser())


// Routes
app.use("/api/auth",authLimiter, authRoutes) // Auth Route 
app.use("/api/users", userRoutes) //User Route
app.use("/api/requests", playRequestRoutes) //play requests route
app.use("/api/admin", adminRoutes) //admin route

// using swagger for api documentation so anyone can see and test those apis that i have built in this application 
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// handling all api requests that doesnt exist 
app.use("*name", (req,res) =>{
    res.sendFile(path.join(__dirname, "..", "/public/index.html"))
})

module.exports = app
