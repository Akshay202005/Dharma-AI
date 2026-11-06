import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// MP3 files live here and are served at /audio/<filename> (see app.js below)
const AUDIO_DIR = path.join(process.cwd(), "uploads", "audio");

// Flash model: fast, and it costs roughly half the credits per character
// of the standard model (check ElevenLabs pricing to confirm).
// That stretches the 10k free credits a lot further.
const MODEL_ID = process.env.ELEVENLABS_MODEL_ID || "eleven_flash_v2_5";

// Slightly different delivery per emotion (speed range is 0.7 to 1.2).
// Emotions not listed use "default".
const DELIVERY = {
    fear: { stability: 0.75, speed: 0.92 },
    anxiety: { stability: 0.75, speed: 0.92 },
    sadness: { stability: 0.7, speed: 0.9 },
    anger: { stability: 0.65, speed: 0.95 },
    default: { stability: 0.6, speed: 0.95 },
};

export const synthesizeSpeech = async ({ text, emotion, krishna, baseUrl }) => {
    try {
        const apiKey = process.env.ELEVENLABS_API_KEY;
        const voiceId = krishna?.voice?.voiceId || process.env.ELEVENLABS_VOICE_ID;
        if (!apiKey || !voiceId) {
            console.warn("ElevenLabs not configured (missing API key or voice id).");
            return null; // controller answers 503, the app falls back to the device voice
        }

        const { stability, speed } = DELIVERY[emotion] || DELIVERY.default;

        const res = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
            {
                method: "POST",
                headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
                body: JSON.stringify({
                    text,
                    model_id: MODEL_ID,
                    voice_settings: { stability, similarity_boost: 0.8, speed },
                }),
                signal: AbortSignal.timeout(20000), // never hang the request forever
            }
        );

        if (!res.ok) {
            console.error("ElevenLabs error:", res.status, await res.text());
            return null;
        }

        // The response body IS the MP3 file. Save it under an unguessable name.
        const buffer = Buffer.from(await res.arrayBuffer());
        const filename = `${crypto.randomUUID()}.mp3`;
        await fs.mkdir(AUDIO_DIR, { recursive: true });
        await fs.writeFile(path.join(AUDIO_DIR, filename), buffer);

        const base = (baseUrl || "").replace(/\/$/, "");
        return {
            url: `${base}/audio/${filename}`,
            mimeType: "audio/mpeg",
            durationMs: Math.round(buffer.length / 16), // 128 kbps = 16,000 bytes per second
            storageId: filename, // deleteSpeechFiles turns this back into a file path
            lipSync: [], // not needed for the static-image demo
        };
    } catch (error) {
        console.error("synthesizeSpeech error:", error);
        return null;
    }
};

// Called by chatCleanup.service.js when chats, messages or accounts are deleted
export const deleteSpeechFiles = async (storageIds) => {
    await Promise.allSettled(
        storageIds.map((id) =>
            // path.basename stops a bad id like "../../x" from escaping the audio folder
            fs.unlink(path.join(AUDIO_DIR, path.basename(String(id))))
        )
    );
};