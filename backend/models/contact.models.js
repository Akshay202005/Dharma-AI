import mongoose, { Schema } from "mongoose";

const contactSchema = new Schema(
    {
        name: {
            type: String,
            required: [true,  "Name is required"],
            trim: true,
            maxlength: 80,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
        },
        subject: {
            type: String,
            trim: true,
            maxlength: 120,
            default: "General",
        },
        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            minlength: 10,
            maxlength: 3000,
        },

        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        status: {
            type: String,
            enum: ["new", "read", "resolved"],
            default: "new",
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Contact", contactSchema);