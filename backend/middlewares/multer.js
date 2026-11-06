import multer from "multer";

// memoryStorage keeps the file in RAM as a buffer. Nothing is written to your disk,
// and we stream the buffer straight to Cloudinary.
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
    fileFilter: (req, file, cb) => {
        if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error("Only JPG, PNG or WEBP images are allowed."));
        }
    },
});

// Wrapper so multer errors (too big, wrong type) come back as clean JSON 400s
// instead of falling through to Express's default HTML error page.
export const uploadAvatarFile = (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
        if (!err) return next();
        const message =
            err.code === "LIMIT_FILE_SIZE" ? "Image must be under 2 MB." : err.message;
        return res.status(400).json({ message });
    });
};