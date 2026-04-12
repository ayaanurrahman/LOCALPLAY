const swaggerJsdoc = require("swagger-jsdoc")

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Sports Partner Finder API",
            version: "1.0.0",
            description: "API documentation for the Local Sports and Indoor Games Partner Finder Platform"
        },
        servers: [
            {
                url: "http://localhost:3000",
                description: "Development server"
            }
        ],
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: "apiKey",
                    in: "cookie",
                    name: "token"
                }
            },
            schemas: {
                User: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        username: { type: "string" },
                        email: { type: "string" },
                        role: { type: "string", enum: ["user", "admin"] },
                        isBanned: { type: "boolean" },
                        games: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    name: { type: "string", enum: ["chess", "carrom", "badminton", "table tennis", "cards", "cricket", "football"] },
                                    skillLevel: { type: "string", enum: ["beginner", "intermediate", "advanced"] }
                                }
                            }
                        },
                        availability: {
                            type: "object",
                            properties: {
                                days: { type: "array", items: { type: "string" } },
                                timeSlot: { type: "string", enum: ["morning", "afternoon", "evening", "night"] }
                            }
                        },
                        preferredLocation: { type: "string", enum: ["home", "society clubhouse", "local ground"] },
                        bio: { type: "string" },
                        location: {
                            type: "object",
                            properties: {
                                type: { type: "string", example: "Point" },
                                coordinates: { type: "array", items: { type: "number" }, example: [77.1025, 28.7041] },
                                address: { type: "string" }
                            }
                        }
                    }
                },
                PlayRequest: {
                    type: "object",
                    properties: {
                        _id: { type: "string" },
                        sender: { type: "string" },
                        receiver: { type: "string" },
                        game: { type: "string" },
                        location: { type: "string" },
                        proposedTime: { type: "string", format: "date-time" },
                        status: { type: "string", enum: ["pending", "accepted", "declined", "cancelled"] },
                        message: { type: "string" },
                        flagged: { type: "boolean" },
                        flagReason: { type: "string" }
                    }
                },
                Error: {
                    type: "object",
                    properties: {
                        message: { type: "string" }
                    }
                }
            }
        }
    },
    // tells swagger-jsdoc where to find the JSDoc comments
    apis: ["./src/routes/*.js"]
}

const swaggerSpec = swaggerJsdoc(options)

module.exports = swaggerSpec