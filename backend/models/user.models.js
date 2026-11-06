import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new Schema(
    {
        // About User
        avatar: {
            type: {
                url: String,
                localPath: String,
                publicId: String,   // Cloudinary id, needed to delete/replace the image later
            },
            default: {
                url: `https://placehold.co/200x200`,
                localPath: "",
                publicId: "",
            }
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            trim: true,
        },
        password: {
            type: String,
            select: false,
        },

        // Token Verification Expiry
        isOtpVerified: {
            type: Boolean,
            default: false,
        },
        resetOtp: {
            type: String,
        },
        otpExpiry: {
            type: Date,
        },
        refreshToken: {
            type: String,
        },

        // Push Notification
        fcmToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

userSchema.pre("save", async function () {
    if(!this.isModified("password") || !this.password) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
};

export const User = mongoose.model("User", userSchema);