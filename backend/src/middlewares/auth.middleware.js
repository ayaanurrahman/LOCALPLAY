const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const userModel = require("../models/user.model")
const RefreshToken = require("../models/refreshToken.model")

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

const protect = async (req, res, next) => {
    try {
        let token = req.cookies.token
        let userId = null

        // --- try access token first ---
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET)
                userId = decoded.id
            } catch (err) {
                if (err.name !== "TokenExpiredError") {
                    return res.status(401).json({ message: "Invalid token. Please log in again." })
                }
                // access token expired — try to silently refresh below
                token = null
            }
        }

        // --- silent refresh: access token expired but refresh token present ---
        if (!token) {
            const rawRefreshToken = req.cookies.refreshToken
            if (!rawRefreshToken) {
                return res.status(401).json({ message: "Please log in again." })
            }

            const tokenHash = crypto.createHash("sha256").update(rawRefreshToken).digest("hex")
            const storedToken = await RefreshToken.findOne({ tokenHash })

            if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
                return res.status(401).json({ message: "Session expired. Please log in again." })
            }

            // rotate tokens
            storedToken.revoked = true
            await storedToken.save()

            const { default: generateRefreshToken } = await Promise.resolve({
                default: async (uId) => {
                    const raw = crypto.randomBytes(64).toString("hex")
                    const hash = crypto.createHash("sha256").update(raw).digest("hex")
                    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    await RefreshToken.create({ user: uId, tokenHash: hash, expiresAt })
                    return raw
                }
            })

            userId = storedToken.user.toString()
            const newAccessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" })
            const newRawRefresh = await generateRefreshToken(userId)

            res.cookie("token", newAccessToken, accessCookieOptions)
            res.cookie("refreshToken", newRawRefresh, refreshCookieOptions)
        }

        if (!userId) {
            return res.status(401).json({ message: "Please log in again." })
        }

        const user = await userModel.findById(userId).select("-password -verifyToken -verifyTokenExpiry")

        if (!user) {
            return res.status(401).json({ message: "User no longer exists." })
        }

        if (user.isBanned) {
            return res.status(403).json({ message: "Your account has been banned. Please contact support." })
        }

        req.user = user
        next()

    } catch (error) {
        res.status(401).json({ message: "Authentication error. Please log in again.", error: error.message })
    }
}

module.exports = { protect }
