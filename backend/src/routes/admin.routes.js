const express = require("express")
const router = express.Router()
const {
    getAllUsers,
    getUserById,
    toggleBanUser,
    deleteUser,
    getAllRequests,
    getPlatformStats,
    flagRequest
} = require("../controllers/admin.controller")
const { protect } = require("../middlewares/auth.middleware")
const { isAdmin } = require("../middlewares/admin.middleware")

// all admin routes require login AND admin role
router.use(protect, isAdmin) // applies to every route below

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       403:
 *         description: Admins only
 */
router.get("/users", getAllUsers)

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get a specific user by ID
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 */
router.get("/users/:id", getUserById)

/**
 * @swagger
 * /api/admin/users/{id}/ban:
 *   put:
 *     summary: Ban or unban a user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User banned or unbanned
 *       400:
 *         description: Cannot ban yourself or another admin
 *       404:
 *         description: User not found
 */
router.put("/users/:id/ban", toggleBanUser)

/**
 * @swagger
 * /api/admin/users/{id}:
 *   delete:
 *     summary: Permanently delete a user
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 *       400:
 *         description: Cannot delete yourself or another admin
 *       404:
 *         description: User not found
 */
router.delete("/users/:id", deleteUser)

/**
 * @swagger
 * /api/admin/requests:
 *   get:
 *     summary: Get all play requests on the platform
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, declined, cancelled]
 *     responses:
 *       200:
 *         description: List of play requests
 */
router.get("/requests", getAllRequests)

/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: Get platform activity stats
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Platform statistics
 */
router.get("/stats", getPlatformStats)

/**
 * @swagger
 * /api/admin/reports/{requestId}:
 *   post:
 *     summary: Flag a play request for misuse
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 example: Abusive message content
 *     responses:
 *       200:
 *         description: Request flagged
 *       404:
 *         description: Request not found
 */
router.post("/reports/:requestId", flagRequest)

module.exports = router