const express = require("express")
const router = express.Router()
const {
    sendRequest,
    getIncomingRequests,
    getOutgoingRequests,
    respondToRequest,
    cancelRequest,
    getMatchHistory
} = require("../controllers/playRequest.controller")
const { protect } = require("../middlewares/auth.middleware")

// all routes protected
/**
 * @swagger
 * /api/requests/send:
 *   post:
 *     summary: Send a play request to another user
 *     tags: [Play Requests]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiverId, game, location, proposedTime]
 *             properties:
 *               receiverId:
 *                 type: string
 *                 example: 664f1b2c3d4e5f6a7b8c9d0e
 *               game:
 *                 type: string
 *                 example: chess
 *               location:
 *                 type: string
 *                 example: society clubhouse
 *               proposedTime:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-05-01T18:00:00.000Z
 *               message:
 *                 type: string
 *                 example: Up for a game this evening?
 *     responses:
 *       201:
 *         description: Play request sent successfully
 *       400:
 *         description: Validation error or duplicate pending request
 *       404:
 *         description: Receiver not found
 */
router.post("/send", protect, sendRequest)

/**
 * @swagger
 * /api/requests/incoming:
 *   get:
 *     summary: Get all incoming play requests
 *     tags: [Play Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of incoming requests
 */
router.get("/incoming", protect, getIncomingRequests)

/**
 * @swagger
 * /api/requests/outgoing:
 *   get:
 *     summary: Get all outgoing play requests
 *     tags: [Play Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of outgoing requests
 */
router.get("/outgoing", protect, getOutgoingRequests)

/**
 * @swagger
 * /api/requests/history:
 *   get:
 *     summary: Get match history (accepted requests)
 *     tags: [Play Requests]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of accepted matches
 */
router.get("/history", protect, getMatchHistory)

/**
 * @swagger
 * /api/requests/{id}/respond:
 *   put:
 *     summary: Accept or decline an incoming request
 *     tags: [Play Requests]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               status:
 *                 type: string
 *                 enum: [accepted, declined]
 *                 example: accepted
 *     responses:
 *       200:
 *         description: Request responded successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Request not found
 */
router.put("/:id/respond", protect, respondToRequest)

/**
 * @swagger
 * /api/requests/{id}/cancel:
 *   put:
 *     summary: Cancel an outgoing pending request
 *     tags: [Play Requests]
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
 *         description: Request cancelled successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Request not found
 */
router.put("/:id/cancel", protect, cancelRequest)

module.exports = router