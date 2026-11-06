import express from "express";
import rateLimit from "express-rate-limit";
import isAuth from "../middlewares/auth.middleware.js"; // adjust to your folder name
import { updateProfile, changePassword, deleteAccount, uploadAvatar } from "../controllers/profile.controller.js";
import { uploadAvatarFile } from "../middlewares/multer.js";

const router = express.Router();

// password checks can be brute-forced by someone on an unlocked laptop, so limit them
const sensitiveLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    message: { message: "Too many attempts. Try again later." },
});

router.patch("/profile", isAuth, updateProfile);
router.patch("/change-password", isAuth, sensitiveLimiter, changePassword);
router.patch("/avatar", isAuth, uploadAvatarFile, uploadAvatar);
router.delete("/account", isAuth, sensitiveLimiter, deleteAccount);

export default router;