import mongoose from "mongoose";
import Chat from "../models/chat.models.js";
import Message from "../models/msg.models.js";
import { getKrishnaProfile } from "../services/krishna.service.js";
import { askKrishnaAI } from "../services/ai.service.js";
import { synthesizeSpeech } from "../services/speech.service.js";
import { deleteMessagesWithAudio, deleteUserChatData } from "../services/chatCleanup.service.js";

const isValidId = (id) => mongoose.isValidObjectId(id);

// a "pending" voice older than this is treated as stuck (server crashed mid-way) and retried
const AUDIO_STALE_MS = 60 * 1000;

// When every AI model is out of quota, this holds the time (epoch ms) the first one comes back.
// 0 = no limit known. Lives in memory, so it resets if the backend restarts (the next 429 sets it again).
let limitUntil = 0;

// "I'm afraid I'll fail" -> short sidebar title
const makeTitle = (text) => {
    const clean = text.replace(/\s+/g, " ").trim();
    return clean.length > 40 ? clean.slice(0, 40).trim() + "..." : clean;
};

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Which animation clip Krishna plays for this emotion.
// Uses krishna.animations (a Map such as fear -> "comfort"), then its "default" entry.
const pickGesture = (krishna, emotion) => {
    const clips = krishna?.animations;
    const get = (key) => (clips instanceof Map ? clips.get(key) : clips?.[key]);
    return get(emotion) || get("default") || "talking";
};

// POST /api/chat/message   body: { chatId?, content }   (no chatId = new conversation)
// Returns the TEXT reply straight away. The voice is requested separately (see getMessageAudio),
// so the user never waits for speech generation before seeing the answer.
export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.body;
        const content = typeof req.body.content === "string" ? req.body.content.trim() : "";

        if (!content) return res.status(400).json({ message: "Message cannot be empty." });
        if (content.length > 4000) return res.status(400).json({ message: "Message is too long (max 4000 characters)." });

        // 1. load Krishna (emotion is now detected together with the reply in step 3)
        const krishna = await getKrishnaProfile();

        // 2. existing chat? check it belongs to this user and load earlier messages
        let chat = null;
        let history = [];
        if (chatId !== undefined && chatId !== null) {
            if (typeof chatId !== "string" || !isValidId(chatId)) {
                return res.status(400).json({ message: "Invalid chat id." });
            }
            chat = await Chat.findOne({ _id: chatId, user: req.userId });
            if (!chat) return res.status(404).json({ message: "Chat not found." });
            // newest 20 messages, then flipped back into reading order (oldest -> newest)
            history = (
                await Message.find({ conversationId: chat._id })
                    .sort({ createdAt: -1, _id: -1 })
                    .limit(20)
                    .lean()
            ).reverse();
        }

        // 3. ask the AI service for emotion + reply in ONE call, BEFORE saving anything.
        //    If this fails, nothing is stored, so the user can safely retry.
        const { emotion, reply } = await askKrishnaAI({ content, history });

        // 4. create the chat (first message only) and save both messages
        const isNewChat = !chat;
        if (isNewChat) {
            chat = await Chat.create({
                user: req.userId,
                krishna: krishna._id,
                emotion,
                title: makeTitle(content),
            });
        }

        const userMessage = await Message.create({
            user: req.userId,
            conversationId: chat._id,
            sender: "User",
            content,
            emotion,
        });

        const krishnaMessage = await Message.create({
            user: req.userId,
            conversationId: chat._id,
            sender: "Krishna",
            content: reply.text,
            emotion,
            source: reply.source,
            reference: reply.reference,
            gesture: pickGesture(krishna, emotion),
            audio: { status: "none" },
        });

        // 5. existing chat: refresh emotion and move it to the top of the sidebar
        if (!isNewChat) {
            chat.emotion = emotion;
            chat.updatedAt = new Date();
            await chat.save();
        }

        limitUntil = 0; // the AI answered, so there is no limit right now

        return res.status(201).json({
            chat: { _id: chat._id, title: chat.title, emotion: chat.emotion, updatedAt: chat.updatedAt },
            userMessage,
            krishnaMessage,
        });
    } catch (error) {
        // every AI model is out of quota: nothing was saved, tell the app when to try again
        if (error.code === "AI_LIMIT") {
            limitUntil = Number(error.resetsAt) || Date.now() + 60_000;
            return res.status(429).json({ code: "AI_LIMIT", resetsAt: limitUntil });
        }
        console.error("sendMessage error:", error);
        if (error.code === "AI_UNAVAILABLE") {
            return res.status(503).json({ message: "Krishna is unavailable right now. Please try again in a moment." });
        }
        return res.status(500).json({ message: "Could not send your message. Please try again." });
    }
};

// GET /api/chat/status   -> { limited, resetsAt }
// The app and website call this when the chat screen opens, so the send button is
// already disabled if the AI limit is active.
export const getChatStatus = (req, res) => {
    const limited = Date.now() < limitUntil;
    return res.status(200).json({ limited, resetsAt: limited ? limitUntil : null });
};

// baseUrl is the address the client used to reach this server, so the audio link
// is correct on any Wi-Fi. Old messages are rebuilt from the saved file name.
const audioPayload = (msg, baseUrl) => ({
    messageId: msg._id,
    gesture: msg.gesture,
    audio: {
        url: msg.audio.storageId ? `${baseUrl}/audio/${msg.audio.storageId}` : msg.audio.url,
        mimeType: msg.audio.mimeType,
        durationMs: msg.audio.durationMs,
    },
    lipSync: msg.lipSync || [],
});

// POST /api/chat/messages/:messageId/audio
// Creates Krishna's voice for one reply (first call) or returns the saved one (later calls).
//   200 -> { messageId, gesture, audio: { url, mimeType, durationMs }, lipSync }
//   202 -> another request is already creating it; ask again in a moment
//   503 -> voice is not available right now (the text reply is still fine)
export const getMessageAudio = async (req, res) => {
    try {
        const { messageId } = req.params;
        if (!isValidId(messageId)) return res.status(400).json({ message: "Invalid message id." });

        const baseUrl = `${req.protocol}://${req.get("host")}`;
        const base = { _id: messageId, user: req.userId, sender: "Krishna" };

        // Atomically "claim" the job. Only ONE request can switch the status to "pending",
        // so two quick clicks (or two tabs) never generate the same voice twice.
        const claimed = await Message.findOneAndUpdate(
            {
                ...base,
                $or: [
                    { "audio.status": { $exists: false } }, // messages saved before voice existed
                    { "audio.status": { $in: ["none", "failed"] } },
                    { "audio.status": "pending", "audio.requestedAt": { $lt: new Date(Date.now() - AUDIO_STALE_MS) } },
                ],
            },
            { $set: { "audio.status": "pending", "audio.requestedAt": new Date() } },
            { returnDocument: "after" }
        );

        if (!claimed) {
            // not claimable: it does not exist / is not yours, is ready, or is being created now
            const existing = await Message.findOne(base).select("+lipSync");
            if (!existing) return res.status(404).json({ message: "Message not found." });
            if (existing.audio?.status === "ready") return res.status(200).json(audioPayload(existing, baseUrl));
            return res.status(202).json({ status: "pending", message: "Voice is being prepared." });
        }

        try {
            const krishna = await getKrishnaProfile();
            const speech = await synthesizeSpeech({
                text: claimed.content,
                emotion: claimed.emotion,
                krishna,
                baseUrl,
            });

            if (!speech?.url) {
                // voice not connected / unavailable: release the claim so a later call can retry
                await Message.updateOne({ _id: claimed._id }, { $set: { "audio.status": "none" } });
                return res.status(503).json({ message: "Voice is not available right now." });
            }

            const updated = await Message.findByIdAndUpdate(
                claimed._id,
                {
                    $set: {
                        "audio.status": "ready",
                        "audio.url": speech.url,
                        "audio.mimeType": speech.mimeType,
                        "audio.durationMs": speech.durationMs,
                        "audio.storageId": speech.storageId,
                        lipSync: speech.lipSync || [],
                    },
                },
                { returnDocument: "after" }
            ).select("+lipSync");

            return res.status(200).json(audioPayload(updated, baseUrl));
        } catch (error) {
            console.error("getMessageAudio synthesis error:", error);
            await Message.updateOne({ _id: claimed._id }, { $set: { "audio.status": "failed" } });
            return res.status(500).json({ message: "Could not create the voice. The text reply is still available." });
        }
    } catch (error) {
        console.error("getMessageAudio error:", error);
        return res.status(500).json({ message: "Could not load the voice." });
    }
};

// GET /api/chat?q=search   -> sidebar list
export const getChats = async (req, res) => {
    try {
        const filter = { user: req.userId, status: "active" };
        const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
        if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };

        const chats = await Chat.find(filter)
            .sort({ updatedAt: -1 })
            .limit(100)
            .select("title emotion updatedAt");

        return res.status(200).json({ chats });
    } catch (error) {
        console.error("getChats error:", error);
        return res.status(500).json({ message: "Could not load your chats." });
    }
};

// GET /api/chat/:id   -> all messages of one conversation
// (lipSync is not included: the audio endpoint returns it when a message is replayed)
export const getChatMessages = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: "Invalid chat id." });

        const chat = await Chat.findOne({ _id: id, user: req.userId }).select("title emotion updatedAt");
        if (!chat) return res.status(404).json({ message: "Chat not found." });

        const messages = await Message.find({ conversationId: id, user: req.userId }).sort({ createdAt: 1, _id: 1 });
        return res.status(200).json({ chat, messages });
    } catch (error) {
        console.error("getChatMessages error:", error);
        return res.status(500).json({ message: "Could not load this chat." });
    }
};

// DELETE /api/chat/:id   -> delete one conversation (and its voice files)
export const deleteChat = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: "Invalid chat id." });

        const chat = await Chat.findOneAndDelete({ _id: id, user: req.userId });
        if (!chat) return res.status(404).json({ message: "Chat not found." });

        await deleteMessagesWithAudio({ conversationId: id, user: req.userId });
        return res.status(200).json({ message: "Chat deleted." });
    } catch (error) {
        console.error("deleteChat error:", error);
        return res.status(500).json({ message: "Could not delete this chat." });
    }
};

// PATCH /api/chat/:id   body: { title }   -> rename one conversation
export const renameChat = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidId(id)) return res.status(400).json({ message: "Invalid chat id." });

        const title = typeof req.body.title === "string" ? req.body.title.replace(/\s+/g, " ").trim() : "";
        if (!title) return res.status(400).json({ message: "Title cannot be empty." });
        if (title.length > 60) return res.status(400).json({ message: "Title is too long (max 60 characters)." });

        // timestamps:false -> renaming does not change updatedAt, so the chat keeps its place in the sidebar
        const chat = await Chat.findOneAndUpdate(
            { _id: id, user: req.userId },
            { $set: { title } },
            { returnDocument: "after", timestamps: false }
        ).select("title emotion updatedAt");

        if (!chat) return res.status(404).json({ message: "Chat not found." });
        return res.status(200).json({ chat });
    } catch (error) {
        console.error("renameChat error:", error);
        return res.status(500).json({ message: "Could not rename this chat." });
    }
};

// DELETE /api/chat   -> "Clear Chat History" button on the Profile page
export const clearChats = async (req, res) => {
    try {
        await deleteUserChatData(req.userId);
        return res.status(200).json({ message: "Chat history cleared." });
    } catch (error) {
        console.error("clearChats error:", error);
        return res.status(500).json({ message: "Could not clear your chat history." });
    }
};