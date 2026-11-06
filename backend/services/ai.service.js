import Message from "../models/msg.models.js";

const TIMEOUT_MS = 45_000; // the LLM can take a few seconds; give up after 45s

// Single source of truth: read the allowed emotions straight from the Message schema enum
const ALLOWED_EMOTIONS = Message.schema.path("emotion").enumValues;

// Read the env var when called (not at the top of the file), because with ES modules
// imports run before dotenv may have loaded .env
const getBaseUrl = () => (process.env.AI_SERVICE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");

// Your DB uses sender "User" | "Krishna"; the LLM API expects role "user" | "assistant"
const toAIHistory = (messages) =>
    messages.map((m) => ({
        role: m.sender === "Krishna" ? "assistant" : "user",
        content: m.content,
    }));

// Marks errors that mean "the AI service is down or failed" so the controller can answer with a 503
const aiError = (message) => {
    const err = new Error(message);
    err.code = "AI_UNAVAILABLE";
    return err;
};

// Returns { emotion, reply: { text, source, reference } }
// (same shape your controller already uses for reply.text / reply.source / reply.reference)
export const askKrishnaAI = async ({ content, history = [] }) => {
    let response;
    try {
        response = await fetch(`${getBaseUrl()}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: content, history: toAIHistory(history) }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch (err) {
        // service not running, network problem, or timeout
        throw aiError(`AI service unreachable: ${err.message}`);
    }

    // Every AI model is out of quota: tell the controller when the first one comes back
    if (response.status === 429) {
        const data = await response.json().catch(() => ({}));
        const err = new Error("AI limit reached");
        err.code = "AI_LIMIT";
        err.resetsAt = Number(data?.resetsAt) || Date.now() + 60_000;
        throw err;
    }

    if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw aiError(`AI service returned ${response.status}: ${detail}`);
    }

    const data = await response.json();
    const text = typeof data.reply === "string" ? data.reply.trim() : "";
    if (!text) throw aiError("AI service returned an empty reply");

    // Defensive check: even though FastAPI already validates, a bad label here
    // would make Mongoose reject the message save
    const emotion = ALLOWED_EMOTIONS.includes(data.emotion) ? data.emotion : "other";

    return {
        emotion,
        reply: { text, source: "llm", reference: undefined }, // no RAG yet, so no reference
    };
};