import crypto from "crypto";
import { User } from "../models/user.models.js";
import genToken from "../utils/generateToken.js";
import { sendOtpMail } from "../utils/sendEmail.js";
import { adminAuth } from "../config/firebaseAdmin.js";
// NOTE: bcrypt is no longer imported here. The model's pre("save") hook hashes passwords.

// Built inside a function so process.env is read at request time (safe with dotenv load order)
export const getCookieOptions = () => {
    const isProd = process.env.NODE_ENV === "production";
    
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    }
};

// FIX: never send secrets/internal fields to the browser
const sanitizeUser = (user) => {
    const obj = user.toObject();
    obj.hasPassword = !!obj.password; // compute BEFORE the password is deleted below
    ["password", "confirmPassword", "resetOtp", "otpExpiry", "isOtpVerified", "refreshToken", "fcmToken"]
        .forEach((key) => delete obj[key]);
    return obj;
};

// Sets the cookie (website) and, only for the mobile app, also returns the token in the body
const sendAuthResponse = async (req, res, user, status) => {
    const token = await genToken(user._id);
    res.cookie("token", token, getCookieOptions());

    const body = sanitizeUser(user);
    if (req.headers["x-client-type"] === "mobile") {
        body.token = token;
    }
    return res.status(status).json(body);
};

// Signup
export const signUp = async (req, res) => {
    try {
        const { fullName, email, password, confirmPassword } = req.body;

        // FIX: password.length would crash with a 500 if a field was missing
        if (!fullName || !email || !password || !confirmPassword) {
            return res.status(400).json({ message: "All fields are required." });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: "User already exist." });
        }
        if (password.length < 8) {
            return res.status(400).json({ message: "Password must be atleast 8 characters long." });
        }
        if (confirmPassword !== password) {
            return res.status(400).json({ message: "Passwords do not match." });
        }

        // FIX: pass the PLAIN password. The model's pre("save") hook hashes it once.
        // FIX: confirmPassword is not stored (it's only for validation)
        const user = await User.create({ fullName, email: normalizedEmail, password });

        return sendAuthResponse(req, res, user, 201);
    } catch (error) {
        return res.status(500).json({ message: `Signup error: ${error.message}` });
    }
};

// Signin
export const signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required." });
        }

        // FIX: password has select:false in the model, so we must ask for it explicitly
        const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+password");
        if (!user) {
            return res.status(400).json({ message: "User does not exist." });
        }

        // Google-only accounts have no password
        if (!user.password) {
            return res.status(400).json({ message: "This account uses Google sign-in." });
        }

        const isMatch = await user.isPasswordCorrect(password);
        if (!isMatch) {
            // FIX: return, otherwise the code keeps running after replying
            return res.status(400).json({ message: "Incorrect password!" });
        }

        return sendAuthResponse(req, res, user, 200);
    } catch (error) {
        return res.status(500).json({ message: `Signin error: ${error.message}` });
    }
};

// Signout
export const signOut = async (req, res) => {
    try {
        // clearCookie works best when the options match the ones used to set it
        const { maxAge, ...clearOptions } = getCookieOptions();
        res.clearCookie("token", clearOptions);
        return res.status(200).json({ message: "Logged out succesfully" });
    } catch (error) {
        return res.status(500).json({ message: `Logout error: ${error.message}` });
    }
};

// Google Auth
export const googleAuth = async (req, res) => {
  let decoded;
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "Token missing" });
    decoded = await adminAuth.verifyIdToken(idToken); // throws if fake/expired
  } catch {
    return res.status(401).json({ message: "Invalid Google token" });
  }

  try {
    if (!decoded.email || !decoded.email_verified) {
      return res.status(401).json({ message: "Google email not verified" });
    }
    const email = decoded.email.toLowerCase().trim();

    let user = await User.findOne({ email }).select("+password");
    if (!user) {
      user = await User.create({ fullName: decoded.name || email.split("@")[0], email });
    }

    return sendAuthResponse(req, res, user, 200);
  } catch (error) {
    return res.status(500).json({ message: `Google auth error: ${error.message}` });
  }
};

// Get current user (NEW) - used by the frontend to restore the session on reload
export const getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("+password"); // req.userId is set by isAuth
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        return res.status(200).json(sanitizeUser(user));
    } catch (error) {
        return res.status(500).json({ message: `Get current user error: ${error.message}` });
    }
};

// Send OTP
export const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: "Email is required." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "User does not exist." });
        }

        // crypto.randomInt is cryptographically secure (Math.random is predictable)
        const otp = crypto.randomInt(1000, 10000).toString();

        user.resetOtp = otp;
        user.otpExpiry = Date.now() + 5 * 60 * 1000;
        user.isOtpVerified = false;
        await user.save();

        await sendOtpMail(user.email, otp);
        return res.status(200).json({ message: "OTP sent successfully." });
    } catch (error) {
        return res.status(500).json({ message: `Send OTP error: ${error.message}` });
    }
};

// Verify OTP
export const verifyOtp = async (req, res) => {
    try {
        // FIX: otp was never read from the request body (it caused a ReferenceError)
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ message: "Email and OTP are required." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(400).json({ message: "User does not exist." });
        }

        // FIX: expired means expiry is in the PAST (< now). It was reversed before.
        if (!user.resetOtp || !user.otpExpiry || user.resetOtp !== otp.toString() || user.otpExpiry.getTime() < Date.now()) {
            return res.status(400).json({ message: "Invalid/Expired OTP." });
        }

        user.isOtpVerified = true;
        user.resetOtp = undefined;
        user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (error) {
        return res.status(500).json({ message: `OTP verification error: ${error.message}` });
    }
};

// Reset Password
export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        if (!email || !newPassword) {
            return res.status(400).json({ message: "Email and new password are required." });
        }
        if (newPassword.length < 8) {
            return res.status(400).json({ message: "Password must be atleast 8 characters long." });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user || !user.isOtpVerified) {
            return res.status(400).json({ message: "OTP not verified." });
        }

        // FIX: assign the PLAIN password; the pre("save") hook hashes it (was double-hashed)
        user.password = newPassword;
        user.isOtpVerified = false;
        user.otpExpiry = undefined;
        await user.save();

        // FIX: success must be 200 (it was 400)
        return res.status(200).json({ message: "Password reset successfully." });
    } catch (error) {
        return res.status(500).json({ message: `Reset password error: ${error.message}` });
    }
};