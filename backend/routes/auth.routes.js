import express from "express";
import rateLimit from "express-rate-limit";
import { getCurrentUser, googleAuth, resetPassword, sendOtp, signIn, signOut, signUp, verifyOtp } from "../controllers/auth.controller.js"
import isAuth from "../middlewares/auth.middleware.js"


const authRouter = express.Router();

const makeLimiter = (limit) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,   // counts attempts per 15 minutes
    limit,                      // max attempts per IP in that window
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts. Try again after 15 minutes." },
  });

const loginLimiter = makeLimiter(10);
const sendOtpLimiter = makeLimiter(5);
const verifyOtpLimiter = makeLimiter(5);
const signupLimiter = makeLimiter(10);
const resetPasswordLimiter = makeLimiter(5);


authRouter.post("/signup", signupLimiter, signUp);
authRouter.post("/signin",loginLimiter, signIn);
authRouter.post("/google-auth", googleAuth);
authRouter.get("/signout", signOut);
authRouter.post("/send-otp",sendOtpLimiter, sendOtp)
authRouter.post("/verify-otp",verifyOtpLimiter, verifyOtp)
authRouter.post("/reset-password", resetPasswordLimiter, resetPassword)
authRouter.get("/current", isAuth, getCurrentUser)

export default authRouter;