import { getKrishnaProfile } from "../services/krishna.service.js";

// GET /api/krishna -> what the chat page needs to show and animate Krishna.
// Only safe fields: voiceId, personaPrompt, emotion replies etc. never leave the server.
export const getKrishna = async (req, res) => {
    try {
        const krishna = await getKrishnaProfile();

        res.set("Cache-Control", "public, max-age=300"); // changes rarely
        return res.status(200).json({
            krishna: {
                name: krishna.name,
                title: krishna.title,
                description: krishna.description,
                avatarUrl: krishna.avatarUrl,
                model: {
                    url: krishna.krishnaModel?.url,
                    format: krishna.krishnaModel?.format,
                    scale: krishna.krishnaModel?.scale,
                },
                animations: Object.fromEntries(krishna.animations ?? []), // { fear: "comfort", default: "talking", ... }
                language: krishna.voice?.language || "en",
            },
        });
    } catch (error) {
        console.error("getKrishna error:", error);
        return res.status(500).json({ message: "Could not load Krishna." });
    }
};