import mongoose, { Schema } from "mongoose";

const responseSchema = new Schema(
    {
        text: {
            type: String,
            required: true,
        },
        source: {
            type: String,
        },
    },
    {
        _id: false,
    }
);

const emotionSchema = new Schema(
    {
        emotion: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        label: {
            type: String,
        },
        response:[responseSchema],
    },
    {
        _id: false
    }
);

const krishnaSchema = new Schema(
    {
        // Profile
        name: {
            type: String,
            default: "Krishna",
        },
        title: {
            type: String,
        },
        description: {
            type: String,
        },
        avatarUrl: {
            type: String,
        },

        // Emotion Wisdom
        emotions: [emotionSchema],

        // AI Support
        personaPrompt: {
            type: String,
        },
        keyTeachings: [String],

        // 3D Model
        krishnaModel: {
            url: String,
            format: {
                type: String,
                enum: ["glb", "gltf", "fbx"],
                default: "glb",
            },
            scale: {
                type: Number,
                default: 1,
            },
        },
        animations: {
            type: Map,
            of: String,
        },

        // Voice and language
        voice: {
            voiceId: String,
            language: {
                type: String,
                default: "en"
            }
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Krishna", krishnaSchema);