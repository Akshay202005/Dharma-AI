import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import { serverUrl } from "../App";
import PasswordInput from "../components/PasswordInput";

const inputClass =
  "w-full px-3 py-2 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const btnClass =
  "cursor-pointer px-3 py-2 bg-transparent text-[#FFD76A] font-semibold border-2 border-[#A87A22] rounded-lg hover:bg-[#A87A22] hover:text-[#03060C] disabled:opacity-50 disabled:cursor-not-allowed";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = otp, 3 = new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Runs an API call with loading + error handling, so each step stays short
  const run = async (fn) => {
    setErr("");
    setLoading(true);
    try {
      await fn();
    } catch (error) {
      setErr(error?.response?.data?.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = () =>
    run(async () => {
      await axios.post(`${serverUrl}/api/auth/send-otp`, { email });
      setStep(2);
    });

  const verifyOtp = () =>
    run(async () => {
      await axios.post(`${serverUrl}/api/auth/verify-otp`, { email, otp });
      setStep(3);
    });

  const resetPassword = () => {
    if (newPassword.length < 8) return setErr("Password must be at least 8 characters.");
    if (newPassword !== confirmPassword) return setErr("Passwords do not match.");
    run(async () => {
      await axios.post(`${serverUrl}/api/auth/reset-password`, { email, newPassword });
      navigate("/signin", { replace: true });
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // stops the page from reloading
    if (step === 1) sendOtp();
    else if (step === 2) verifyOtp();
    else resetPassword();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[url('/images/BG_Cosmic.png')] bg-cover bg-center bg-no-repeat">
      <form
        onSubmit={handleSubmit}
        className="bg-[#03060C] rounded-xl shadow-lg w-full max-w-md p-3 text-white border-2 border-[#6D6C6C]"
      >
        <img src="/images/Logo.png" alt="Dharma AI Logo" className="w-12 h-12" />
        <h1 className="text-3xl font-bold mb-2 text-center">Forgot Password</h1>

        {step === 1 && (
          <>
            <p className="text-center text-sm text-gray-400 mb-4">Enter your email and we'll send you an OTP.</p>
            <div className="mb-4">
              <label htmlFor="email" className="block font-medium mb-1">Email</label>
              <input type="email" id="email" placeholder="Enter your email" autoComplete="email"
                className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="mb-4 text-center">
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Sending..." : "Send OTP"}
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-center text-sm text-gray-400 mb-4">Enter the 4-digit OTP sent to {email}. It expires in 5 minutes.</p>
            <div className="mb-4">
              <label htmlFor="otp" className="block font-medium mb-1">OTP</label>
              <input type="text" id="otp" placeholder="Enter OTP" inputMode="numeric" maxLength={4}
                autoComplete="one-time-code" className={inputClass}
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} required />
            </div>
            <div className="mb-4 text-center">
              <button type="submit" disabled={loading || otp.length !== 4} className={btnClass}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
            </div>
            <p className="text-center text-sm">
              <button type="button" onClick={sendOtp} disabled={loading}
                className="text-[#FFD76A] hover:underline cursor-pointer">Resend OTP</button>
            </p>
          </>
        )}

        {step === 3 && (
          <>
            <div className="mb-4">
              <label htmlFor="newPassword" className="block font-medium mb-1">New Password</label>
              <PasswordInput id="newPassword" placeholder="Enter new password" autoComplete="new-password"
                value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="block font-medium mb-1">Confirm Password</label>
              <PasswordInput id="confirmPassword" placeholder="Confirm new password" autoComplete="new-password"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <div className="mb-4 text-center">
              <button type="submit" disabled={loading} className={btnClass}>
                {loading ? "Saving..." : "Reset Password"}
              </button>
            </div>
          </>
        )}

        {err && <p className="text-red-500 text-center my-2.5">*{err}</p>}

        <div className="text-center text-[#6D6C6C] mt-2">
          <Link to="/signin" className="text-[#FFD76A] hover:underline">Back to Sign In</Link>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword;