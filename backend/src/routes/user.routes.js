const express = require("express")
const router = express.Router()
const {getProfile, updateProfile, searchPlayers} = require("../controllers/user.controller")
const {protect} = require("../middlewares/auth.middleware")

// all user routes are protected — user must be logged in
/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get logged in user's profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get("/profile", protect, getProfile)

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update logged in user's profile
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               games:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: chess
 *                     skillLevel:
 *                       type: string
 *                       example: intermediate
 *               availability:
 *                 type: object
 *                 properties:
 *                   days:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["saturday", "sunday"]
 *                   timeSlot:
 *                     type: string
 *                     example: evening
 *               preferredLocation:
 *                 type: string
 *                 example: society clubhouse
 *               bio:
 *                 type: string
 *                 example: Looking for a chess partner nearby
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     example: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [77.1025, 28.7041]
 *                   address:
 *                     type: string
 *                     example: Dwarka, Delhi
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Not authenticated
 */
router.put("/profile", protect, updateProfile)

/**
 * @swagger
 * /api/users/search:
 *   get:
 *     summary: Search for nearby players
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         required: true
 *         schema:
 *           type: number
 *         example: 28.7041
 *       - in: query
 *         name: lng
 *         required: true
 *         schema:
 *           type: number
 *         example: 77.1025
 *       - in: query
 *         name: game
 *         schema:
 *           type: string
 *         example: chess
 *       - in: query
 *         name: skillLevel
 *         schema:
 *           type: string
 *         example: intermediate
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *         example: saturday
 *       - in: query
 *         name: timeSlot
 *         schema:
 *           type: string
 *         example: evening
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *         example: 5000
 *     responses:
 *       200:
 *         description: List of nearby players
 *       400:
 *         description: Missing coordinates
 *       401:
 *         description: Not authenticated
 */
router.get("/search", protect, searchPlayers)
module.exports = router