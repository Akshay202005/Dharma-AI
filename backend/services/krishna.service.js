import Krishna from "../models/krishna.models.js";

// ---------------------------------------------------------------
// 1. Emotion detection (placeholder: keyword scoring)
//    Later you can replace the body of detectEmotion() with a call
//    to your Python/FastAPI service. The rest of the app won't change.
// ---------------------------------------------------------------
const EMOTION_KEYWORDS = {
    fear: ["afraid", "fear", "scared", "terrified", "frightened", "fail", "failure", "panic"],
    anger: ["angry", "anger", "furious", "hate", "rage", "annoyed", "irritated", "revenge", "betrayed"],
    sadness: ["sad", "depressed", "cry", "crying", "hopeless", "heartbroken", "grief", "hurt", "empty"],
    anxiety: ["anxious", "anxiety", "worried", "worry", "stress", "stressed", "overthinking", "pressure", "tense"],
    confusion: ["confused", "confusion", "unsure", "dilemma", "don't know", "dont know", "what should i do", "decide", "choice"],
    guilt: ["guilty", "guilt", "regret", "ashamed", "shame", "my fault", "blame"],
    loneliness: ["lonely", "alone", "nobody", "no one", "isolated", "left out"],
};

export const detectEmotion = async (text) => {
    const lower = text.toLowerCase();
    let best = "other";
    let bestScore = 0;

    for (const [emotion, words] of Object.entries(EMOTION_KEYWORDS)) {
        const score = words.filter((w) => lower.includes(w)).length;
        if (score > bestScore) {
            best = emotion;
            bestScore = score;
        }
    }
    return best; // always one of the values allowed by msg.models.js
};

// ---------------------------------------------------------------
// 2. Pre-written replies (fallback when krishna.emotions in the DB
//    has no entry for the emotion). `reference` is the Gita verse.
// ---------------------------------------------------------------
const FALLBACK_REPLIES = {
    fear: [
        { text: "Arjuna once stood on the battlefield with the same fear. No one knows the future, so why burden today with it? Do your work with sincerity, and let the results come in their own time.", reference: "Bhagavad Gita 2.47" },
    ],
    anger: [
        { text: "Anger grows from desire that was blocked, and it clouds the mind until you forget who you are. Pause. Breathe. Then act from clarity, not from the fire.", reference: "Bhagavad Gita 2.62-63" },
    ],
    sadness: [
        { text: "Joy and sorrow come and go like summer and winter. They touch the body and the mind, but they are not you. Bear this season with patience; it will pass.", reference: "Bhagavad Gita 2.14" },
    ],
    anxiety: [
        { text: "The mind is restless, I know. Yet it can be trained, through steady practice and by letting go of what you cannot control. Focus on the one step in front of you.", reference: "Bhagavad Gita 6.35" },
    ],
    confusion: [
        { text: "Arjuna was just as confused about his duty, and he came to me with open hands. Confusion is where wisdom begins. Tell me what troubles you most, and we will look at it together.", reference: "Bhagavad Gita 2.7" },
    ],
    guilt: [
        { text: "Learn from what happened, then let it go. Carrying guilt forever helps no one. Turn towards the right action now, and do not grieve.", reference: "Bhagavad Gita 18.66" },
    ],
    loneliness: [
        { text: "You are never as alone as you feel. I am present in every heart, and those who remember me find me near. Reach out to someone today, and start with me.", reference: "Bhagavad Gita 6.30" },
    ],
    other: [
        { text: "Tell me more about what is on your mind. Lift yourself by your own mind, and do not let it become your enemy. I am listening.", reference: "Bhagavad Gita 6.5" },
    ],
};

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Always gives the chat a Krishna document to point to (chat.krishna is required)
export const getKrishnaProfile = async () => {
    // upsert = "find one, or create it if missing" in a single atomic step,
    // so two simultaneous first requests cannot create two Krishna documents
    return Krishna.findOneAndUpdate(
        {},
        {
            $setOnInsert: {
                name: "Krishna",
                title: "Divine Guide",
                description: "Guide who answers with Mahabharata and Bhagavad Gita wisdom",
            },
        },
        { upsert: true, returnDocument: "after" }
    );
};

// ---------------------------------------------------------------
// 3. Generate Krishna's reply.
//    `history` (earlier messages) is passed in so that an LLM can
//    use it later. Prewritten replies ignore it for now.
// ---------------------------------------------------------------
export const getKrishnaReply = async ({ emotion, krishna, history = [] }) => {
    // First choice: the replies you stored in the DB (krishna.emotions)
    const entry = krishna?.emotions?.find((e) => e.emotion === emotion);
    if (entry?.response?.length) {
        const chosen = pickRandom(entry.response);
        return { text: chosen.text, source: "prewritten", reference: chosen.source };
    }

    // Second choice: the built-in fallback above
    const chosen = pickRandom(FALLBACK_REPLIES[emotion] || FALLBACK_REPLIES.other);
    return { text: chosen.text, source: "prewritten", reference: chosen.reference };
};