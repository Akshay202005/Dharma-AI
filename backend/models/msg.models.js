import mongoose, { Schema } from "mongoose";

// One mouth shape at one moment of the audio: { t: 120, shape: "A" }
// t = milliseconds from the start of the audio
const lipSyncSchema = new Schema(
    {
        t: { 
            type: Number, 
            required: true 
        },
        shape: { 
            type: String, required: true 
        },
    },
    { 
        _id: false 
    }
);

const audioSchema = new Schema(
    {
        status: {
            type: String,
            enum: ["none", "pending", "ready", "failed"],
            default: "none",
        },
        url: { 
            type: String 
        },
        mimeType: { 
            type: String 
        },
        durationMs: { 
            type: Number 
        },
        storageId: { 
            type: String 
        },   // id of the file in your storage, used to delete it later
        requestedAt: { 
            type: Date 
        },   // when generation started (detects a stuck "pending")
    },
    { 
        _id: false 
    }
);

const msgSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        conversationId: {
            type: Schema.Types.ObjectId,
            ref: "Chat",
            required: true,
        },
        sender: {
            type: String,
            enum: ["User", "Krishna"],
            required: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
            maxlength: 4000,
        },
        emotion: {
            type: String,
            enum: [
                "anger", "anxiety", "confusion", "disappointment", "disgust", "embarrassment", "excitement", "fear", "frustration", "gratitude", "guilt", "happiness", "hope", "jealousy", "loneliness", "love", "pride", "relief", "sadness", "surprise", "other",
            ],
            default: "other",
        },
        source: {
            type: String,
            enum: ["prewritten", "llm", "hybrid"]
        },
        reference: {
            type: String,
            trim: true,
        },

        // ----- Krishna messages only -----
        gesture: {
            type: String,          // name of the animation clip Krishna plays while speaking
            trim: true,
        },
        audio: {
            type: audioSchema,
        },
        lipSync: {
            type: [lipSyncSchema],
            default: undefined,
            select: false,         // large; only loaded by the audio endpoint
        },
    },
    {
        timestamps: true,
    }
);

msgSchema.index({
    conversationId: 1,
    createdAt: 1,
})

export default mongoose.model("Message", msgSchema);