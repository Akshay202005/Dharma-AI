import Chat from "../models/chat.models.js";
import Message from "../models/msg.models.js";
import { deleteSpeechFiles } from "./speech.service.js";

// Delete messages that match `filter`, together with their stored audio files.
// File deletion is best-effort: a storage problem must not block the user's delete.
export const deleteMessagesWithAudio = async (filter) => {
    const withAudio = await Message.find({
        ...filter,
        "audio.storageId": { $exists: true, $ne: null },
    })
        .select("audio.storageId")
        .lean();

    const result = await Message.deleteMany(filter);

    const storageIds = withAudio.map((m) => m.audio.storageId);
    if (storageIds.length) {
        try {
            await deleteSpeechFiles(storageIds);
        } catch (error) {
            console.error("deleteSpeechFiles error:", error);
        }
    }
    return result;
};

// Everything a user has in the chat module (used by "Clear Chat History" and "Delete Account")
export const deleteUserChatData = async (userId) => {
    await deleteMessagesWithAudio({ user: userId });
    await Chat.deleteMany({ user: userId });
};