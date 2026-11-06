import { User } from "../models/user.models.js";
import { getCookieOptions } from "./auth.controller.js";
import { configureCloudinary } from "../config/cloudinary.js";
import { deleteUserChatData } from "../services/chatCleanup.service.js";


// Update name
export const updateProfile = async (req, res) => {
    try {
        const fullName = req.body.fullName?.trim();
        if (!fullName || fullName.length < 2 || fullName.length > 80) {
            return res.status(400).json({ message: "Name must be 2 to 80 characters." });
        }

        const user = await User.findByIdAndUpdate(
            req.userId,
            { fullName },
            { new: true } // return the updated doc, not the old one
        );
        if (!user) return res.status(404).json({ message: "User not found." });

        // only return the changed field; the frontend merges it with updateUserData
        return res.status(200).json({ fullName: user.fullName });
    } catch (error) {
        return res.status(500).json({ message: `Update profile error: ${error.message}` });
    }
};

// Change password
export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required." });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be atleast 8 characters long." });
        }
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        const user = await User.findById(req.userId).select("+password");
        if (!user) return res.status(404).json({ message: "User not found." });
        if (!user.password) {
            return res.status(400).json({ message: "This account uses Google sign-in." });
        }

        const isMatch = await user.isPasswordCorrect(currentPassword);
        if (!isMatch) return res.status(400).json({ message: "Current password is incorrect." });

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "New password must be different." });
        }

        user.password = newPassword; // plain; the pre("save") hook hashes it once
        await user.save();

        return res.status(200).json({ message: "Password changed successfully." });
    } catch (error) {
        return res.status(500).json({ message: `Change password error: ${error.message}` });
    }
};

// Delete account
export const deleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("+password");
        if (!user) return res.status(404).json({ message: "User not found." });

        // email/password accounts must confirm with their password
        if (user.password) {
            const { password } = req.body || {};
            if (!password) return res.status(400).json({ message: "Password is required." });
            const isMatch = await user.isPasswordCorrect(password);
            if (!isMatch) return res.status(400).json({ message: "Incorrect password." });
        }

        // NEW
        await deleteUserChatData(req.userId);   // conversations + messages + voice files

        if (user.avatar?.publicId) {
            try {
                await configureCloudinary().uploader.destroy(user.avatar.publicId);
            } catch (e) {
                console.error("Avatar cleanup failed:", e.message);
            }
        }
        // TODO: also delete this user's chats/messages once the chat module exists
        await User.findByIdAndDelete(req.userId);

        const { maxAge, ...clearOptions } = getCookieOptions();
        res.clearCookie("token", clearOptions);
        return res.status(200).json({ message: "Account deleted." });
    } catch (error) {
        return res.status(500).json({ message: `Delete account error: ${error.message}` });
    }
};

// Cloudinary's upload_stream is callback-based; this wraps it in a Promise
const uploadBuffer = (buffer) =>
    new Promise((resolve, reject) => {
        const cloudinary = configureCloudinary();
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "dharma-ai/avatars",
                resource_type: "image",
                // crop to a 400x400 square centred on the face, so every avatar is the same size
                transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
            },
            (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
    });

// Upload / replace avatar
export const uploadAvatar = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "Please choose an image." });

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        const result = await uploadBuffer(req.file.buffer);

        // remove the previous image so Cloudinary doesn't fill up with orphans
        const oldPublicId = user.avatar?.publicId;
        if (oldPublicId) {
            try {
                await configureCloudinary().uploader.destroy(oldPublicId);
            } catch (e) {
                console.error("Old avatar cleanup failed:", e.message);
            }
        }

        user.avatar = { url: result.secure_url, localPath: "", publicId: result.public_id };
        await user.save();

        return res.status(200).json({ avatar: user.avatar });
    } catch (error) {
        return res.status(500).json({ message: `Avatar upload error: ${error.message}` });
    }
};