const express = require("express")
const router = express.Router()

const { register, login, logout, refresh, verifyEmail, resendVerification } = require("../controllers/auth.controller")
const { protect } = require("../middlewares/auth.middleware")

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *                 example: Oblyvix
 *               email:
 *                 type: string
 *                 example: oblyvix@gmail.com
 *               password:
 *                 type: string
 *                 example: Test@1234
 *     responses:
 *       201:
 *         description: Registration successful, verification email sent
 *       400:
 *         description: Validation error or email already registered
 */
router.post("/register", register)

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: oblyvix@gmail.com
 *               password:
 *                 type: string
 *                 example: Test@1234
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", login)

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", logout)

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Issue a new access token using the refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New access token issued
 *       401:
 *         description: Invalid, revoked, or expired refresh token
 */
router.post("/refresh", refresh)

/**
 * @swagger
 * /api/auth/verify/{token}:
 *   get:
 *     summary: Verify email address via token from email link
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
router.get("/verify/:token", verifyEmail)

/**
 * @swagger
 * /api/auth/resend-verify:
 *   post:
 *     summary: Resend verification email (must be logged in)
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Verification email resent
 *       400:
 *         description: Already verified
 *       429:
 *         description: Too soon to resend
 */
router.post("/resend-verify", protect, resendVerification)

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current logged in user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *       401:
 *         description: Not authenticated
 */
router.get("/me", protect, async (req, res) => {
    const user = req.user.toObject()
    user.id = user._id.toString()
    res.status(200).json(user)
})
module.exports = router
