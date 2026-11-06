import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        krishna: {
            type: Schema.Types.ObjectId,
            ref: "Krishna",
            required: true,
        },
        emotion: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        title: {
            type: String,
            trim: true,
            default: "New Conversation",
        },
        status: {
            type: String,
            enum: ["active", "archived"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }

);

chatSchema.index({ 
    user: 1, 
    updatedAt: -1 
});

export default mongoose.model("Chat", chatSchema);