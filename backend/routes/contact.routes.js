import express from "express";
import rateLimit from "express-rate-limit";
import { submitContact } from "../controllers/contact.controller.js";
import { optionalAuth } from "../middlewares/auth.middleware.js";

const contactRouter = express.Router();

// Public form = easy target for spam bots, so allow 5 messages per IP per hour
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many messages sent. Please try again later." },
});

contactRouter.post("/", contactLimiter, optionalAuth, submitContact);

export default contactRouter;