import React, { useState } from 'react'
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useDispatch } from 'react-redux';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { serverUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";

const Signup = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const navigate = useNavigate();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [err, setErr] = useState("");
    const dispatch = useDispatch();

    const handleSignup = async () => {
        try{
            const result = await axios.post(`${serverUrl}/api/auth/signup`, {
                fullName, email, password, confirmPassword,
            }, {withCredentials: true});
            dispatch(setUserData(result.data));
            setErr("");
        }
        catch (error) {
            setErr(error?.response?.data?.message);
        }
    }

    const handleGoogleAuth = async () => {
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            const idToken = await result.user.getIdToken();

            const { data } = await axios.post(
                `${serverUrl}/api/auth/google-auth`,
                { idToken },
                { withCredentials: true }
            );
            dispatch(setUserData(data));
        } catch (error) {
            if (error.code !== "auth/popup-closed-by-user") {
                setErr(error?.response?.data?.message || "Google sign-in failed.");
            }
        }
    };

  return (
    <div className="min-h-dvh w-full flex items-center justify-center p-4 bg-[url('/images/BG_Cosmic.png')] bg-cover bg-center bg-no-repeat">
        <div className={`bg-[#03060C] rounded-xl shadow-lg w-full max-w-md p-5 text-white border-2 border-[#6D6C6C]`}>
            <img src="/images/Logo.png" alt="Dharma AI Logo" className='w-12 h-12'/>
            <h1 className="text-3xl font-bold mb-2 text-center">
                Sign Up
            </h1>

            {/* fullname */}

            <div className="mb-4">
                <label htmlFor="fullName" className="block font-medium mb-1">
                    Full Name
                </label>
                <input
                    type="text" id="fullName" placeholder="Enter your full name" autoComplete="name"
                    className="w-full px-3 py-2 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setFullName(e.target.value)} value={fullName} required
                />
            </div>

            {/* email */}

            <div className="mb-4">
                <label htmlFor="email" className="block font-medium mb-1">
                    Email
                </label>
                <input
                    type="email" id="email" placeholder="Enter your email" autoComplete="email"
                    className="w-full px-3 py-2 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setEmail(e.target.value)} value={email} required
                />
            </div>

            {/* password */}

            <div className="mb-4">
                <label htmlFor="password" className="block font-medium mb-1">
                    Password
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"} id="password" placeholder="Enter your password" autoComplete="new-password"
                        className="w-full px-3 py-2 pr-10 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setPassword(e.target.value)} value={password} required
                    />
                    <button
                        type='button'
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className='absolute right-1 cursor-pointer top-1/2 -translate-y-1/2 p-2 text-gray-500'
                        onClick={() => setShowPassword(prev => !prev)}
                    >
                        {!showPassword ? <FaRegEye /> : <FaRegEyeSlash />}
                    </button>
                </div>
            </div>

            {/* confirm password */}

            <div className="mb-4">
                <label htmlFor="confirmPassword" className="block font-medium mb-1">
                    Confirm Password
                </label>
                <div className="relative">
                    <input
                        type={showConfirm ? "text" : "password"} id="confirmPassword" placeholder="Confirm password" autoComplete="new-password"
                        className="w-full px-3 py-2 pr-10 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e) => setConfirmPassword(e.target.value)} value={confirmPassword} required
                    />
                    <button
                        type='button'
                        aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        className='absolute right-1 cursor-pointer top-1/2 -translate-y-1/2 p-2 text-gray-500'
                        onClick={() => setShowConfirm(prev => !prev)}
                    >
                        {!showConfirm ? <FaRegEye /> : <FaRegEyeSlash />}
                    </button>
                </div>
            </div>

            {/* sign up button */}

            <div className="mb-4 text-center">
                <button className="cursor-pointer px-3 py-2 bg-transparent text-[#FFD76A] font-semibold justify-center border-2 border-[#A87A22] rounded-lg hover:bg-[#A87A22] hover:text-[#03060C] focus:outline-none focus:ring-2 focus:ring-[#A87A22]" onClick={handleSignup}>
                    Sign Up
                </button>
            </div>
            {err && <p className='text-red-500 text-center my-2.5'>*{err}</p>}

            {/* or */}

            <div className="flex items-center gap-3 my-2">
                <span className="flex-1 h-px bg-[#6D6C6C]/50"></span>
                <span className="text-[#6D6C6C] text-sm">OR</span>
                <span className="flex-1 h-px bg-[#6D6C6C]/50"></span>
            </div>

            {/* Sign up Google button */}
            <div className="mb-4 text-center">
                <button
                    type='button'
                    className="inline-flex items-center gap-1 px-3 py-2.5 bg-transparent text-white font-semibold justify-center rounded-lg cursor-pointer hover:underline hover:decoration-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={handleGoogleAuth}
                >
                    <span>Continue with</span>
                    <span className="inline-flex items-center">
                        <FcGoogle className="text-lg" />
                        <span>oogle</span>
                    </span>
                </button>
            </div>

            {/* sign in link */}
            <div className="text-center">
                <p className="text-[#6D6C6C]">
                    <span className='opacity-65'>Already have an account?</span> <button type='button' className="text-[#FFD76A] cursor-pointer hover:underline" onClick={() => navigate("/signin")}>Sign In</button>
                </p>
            </div>
        </div>
    </div>
  )
}

export default Signup