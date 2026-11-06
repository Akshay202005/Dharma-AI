import dotenv from "dotenv";
dotenv.config();
import connectDb from "../config/db.js";
import Krishna from "../models/krishna.models.js";

// EDIT these names to match the animation clips inside your 3D model file.
// Each emotion picks one clip; "default" is used when an emotion has no entry.
const ANIMATIONS = {
    default: "talking",
    fear: "comfort",
    anger: "calm",
    sadness: "comfort",
    anxiety: "calm",
    confusion: "explain",
    guilt: "bless",
    loneliness: "bless",
    other: "talking",
};

const run = async () => {
    await connectDb();

    const krishna = (await Krishna.findOne()) || new Krishna();
    krishna.name = "Krishna";
    krishna.title = krishna.title || "Divine Guide";
    krishna.description = krishna.description || "Guide who answers with Mahabharata and Bhagavad Gita wisdom";
    krishna.animations = new Map(Object.entries(ANIMATIONS));
    krishna.voice = { ...(krishna.voice?.toObject?.() ?? {}), language: krishna.voice?.language || "en" };
    // when your files are ready, set them here (or directly in MongoDB):
    // krishna.avatarUrl = "https://...";
    // krishna.krishnaModel = { url: "https://.../krishna.glb", format: "glb", scale: 1 };

    await krishna.save();
    console.log("Krishna saved. Animations:", Object.fromEntries(krishna.animations));
    process.exit(0);
};

run().catch((error) => {
    console.error(error);
    process.exit(1);
});