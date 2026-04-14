const userModel = require("../models/user.model")
const RefreshToken = require("../models/refreshToken.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { sendVerificationEmail } = require("../utils/email.utils")

// ─── token helpers ────────────────────────────────────────────────────────────

// short-lived access token: 15 minutes
const generateAccessToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" })
}

// long-lived refresh token: 7 days — stored in DB (hashed)
const generateRefreshToken = async (userId) => {
    const rawToken = crypto.randomBytes(64).toString("hex")
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex")
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    await RefreshToken.create({ user: userId, tokenHash, expiresAt })
    return rawToken // only the raw token goes to the client
}

const accessCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 15 * 60 * 1000
}

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

exports.register = async (req, res) => {
    try {
        const { username, email, password } = req.body

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
        if (password.length < 8 || !passwordRegex.test(password)) {
            return res.status(400).json({
                message: "Password must be at least 8 characters and contain one uppercase letter, one lowercase letter, and one number"
            })
        }

        const userExists = await userModel.findOne({ email })
        if (userExists) {
            return res.status(400).json({ message: "Email already registered" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const verifyToken = crypto.randomBytes(32).toString("hex")
        const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

        const user = await userModel.create({
            username, email,
            password: hashedPassword,
            isVerified: false,
            verifyToken,
            verifyTokenExpiry
        })

        // fire and forget — don't block registration if email fails
        sendVerificationEmail(email, username, verifyToken).catch((err) => {
            console.error("Verification email failed:", err.message)
        })

        const accessToken = generateAccessToken(user._id)
        const rawRefreshToken = await generateRefreshToken(user._id)

        res
            .cookie("token", accessToken, accessCookieOptions)
            .cookie("refreshToken", rawRefreshToken, refreshCookieOptions)
            .status(201)
            .json({
                message: "Registration successful. Check your email to verify your account.",
                user: { username: user.username, email: user.email, id: user._id, isVerified: false }
            })

    } catch (error) {
        if (error.name === "ValidationError") {
            const message = Object.values(error.errors).map(val => val.message).join(", ")
            return res.status(400).json({ message })
        }
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

exports.login = async (req, res) => {
    try {
        const existingToken = req.cookies.token
        if (existingToken) {
            try {
                jwt.verify(existingToken, process.env.JWT_SECRET)
                return res.status(200).json({ message: "User already logged in" })
            } catch {
                // expired or invalid — fall through to login
            }
        }

        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" })
        }

        const user = await userModel.findOne({ email })
        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const passMatches = await bcrypt.compare(password, user.password)
        if (!passMatches) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const accessToken = generateAccessToken(user._id)
        const rawRefreshToken = await generateRefreshToken(user._id)

        res
            .cookie("token", accessToken, accessCookieOptions)
            .cookie("refreshToken", rawRefreshToken, refreshCookieOptions)
            .status(200)
            .json({
                message: "Login successful",
                user: { username: user.username, email: user.email, id: user._id, isVerified: user.isVerified }
            })

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

exports.logout = async (req, res) => {
    try {
        const rawRefreshToken = req.cookies.refreshToken

        if (rawRefreshToken) {
            const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex")
            await RefreshToken.findOneAndUpdate({ tokenHash }, { revoked: true })
        }

        res
            .clearCookie("token")
            .clearCookie("refreshToken")
            .status(200)
            .json({ message: "Logged out successfully" })

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

exports.refresh = async (req, res) => {
    try {
        const rawRefreshToken = req.cookies.refreshToken

        if (!rawRefreshToken) {
            return res.status(401).json({ message: "No refresh token provided. Please log in again." })
        }

        const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex")
        const storedToken = await RefreshToken.findOne({ tokenHash })

        if (!storedToken) {
            return res.status(401).json({ message: "Invalid refresh token." })
        }
        if (storedToken.revoked) {
            return res.status(401).json({ message: "Refresh token revoked. Please log in again." })
        }
        if (storedToken.expiresAt < new Date()) {
            return res.status(401).json({ message: "Refresh token expired. Please log in again." })
        }

        // token rotation: revoke old, issue new pair
        storedToken.revoked = true
        await storedToken.save()

        const newAccessToken = generateAccessToken(storedToken.user)
        const newRawRefreshToken = await generateRefreshToken(storedToken.user)

        res
            .cookie("token", newAccessToken, accessCookieOptions)
            .cookie("refreshToken", newRawRefreshToken, refreshCookieOptions)
            .status(200)
            .json({ message: "Token refreshed successfully" })

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// ─── GET /api/auth/verify/:token ─────────────────────────────────────────────

exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.params

        const user = await userModel.findOne({
            verifyToken: token,
            verifyTokenExpiry: { $gt: new Date() }
        })

        if (!user) {
            return res.status(400).json({ message: "Verification link is invalid or has expired." })
        }

        user.isVerified = true
        user.verifyToken = null
        user.verifyTokenExpiry = null
        await user.save()

        res.status(200).json({ message: "Email verified successfully! You can now send play requests." })

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}

// ─── POST /api/auth/resend-verify ────────────────────────────────────────────

exports.resendVerification = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id)

        if (user.isVerified) {
            return res.status(400).json({ message: "Your account is already verified." })
        }

        const verifyToken = crypto.randomBytes(32).toString("hex")
        user.verifyToken = verifyToken
        user.verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)
        await user.save()

        await sendVerificationEmail(user.email, user.username, verifyToken)

        res.status(200).json({ message: "Verification email resent. Please check your inbox." })

    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message })
    }
}
