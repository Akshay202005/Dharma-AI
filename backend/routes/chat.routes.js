import express from "express";
import rateLimit from "express-rate-limit";
import isAuth from "../middlewares/auth.middleware.js"; // adjust folder name if yours differs
import {
    sendMessage,
    getMessageAudio,
    getChats,
    getChatMessages,
    getChatStatus,
    deleteChat,
    clearChats,
    renameChat,
} from "../controllers/chat.controller.js";

const chatRouter = express.Router();

// 20 messages per minute per IP is plenty for a human, and protects the AI/LLM later
const messageLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "You are sending messages too fast. Please wait a moment." },
});

// speech generation usually costs money per request, so it gets its own limit
const audioLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many voice requests. Please wait a moment." },
});

chatRouter.post("/message", isAuth, messageLimiter, sendMessage);
chatRouter.post("/messages/:messageId/audio", isAuth, audioLimiter, getMessageAudio);
chatRouter.get("/", isAuth, getChats);
chatRouter.delete("/", isAuth, clearChats);
// "/status" must stay ABOVE "/:id", otherwise Express treats "status" as a chat id
chatRouter.get("/status", isAuth, getChatStatus);
chatRouter.get("/:id", isAuth, getChatMessages);
chatRouter.delete("/:id", isAuth, deleteChat);
chatRouter.patch("/:id", isAuth, renameChat);

export default chatRouter;