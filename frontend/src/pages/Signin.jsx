import axios from 'axios';
import React from 'react'
import { useState } from 'react';
import { FcGoogle } from 'react-icons/fc'
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import { serverUrl } from '../App';
import { setUserData } from '../redux/userSlice';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../../firebase';
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";

const Signin = () => {

    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const dispatch = useDispatch();

    const handleSignin=async () => {
        try {
            const result=await axios.post(`${serverUrl}/api/auth/signin`,{
                email,password
            },{withCredentials:true})
           dispatch(setUserData(result.data))
            setErr("")
        } catch (error) {
           setErr(error?.response?.data?.message)
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[url('/images/BG_Cosmic.png')] bg-cover bg-center bg-no-repeat">
        <div className={`bg-[#03060C] rounded-xl shadow-lg w-full max-w-md p-3 text-white border-2 border-[#6D6C6C]`}>
            <img src="/images/Logo.png" alt="Dharma AI Logo" className='w-12 h-12'/>
            <h1 className="text-3xl font-bold mb-2 text-center">
                Sign In
            </h1>

            {/* email */}

            <div className="mb-4">
                <label htmlFor="email" className="block text-grey-700 font-medium mb-1">
                    Email
                </label>
                <input
                    type="text" id="email" placeholder="Enter your email"
                    className="w-full px-3 py-2 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e)=>setEmail(e.target.value)} value={email} required
                />
            </div>

            {/* password */}

            <div className="mb-4">
                <label htmlFor="password" className="block text-grey-700 font-medium mb-1">
                    Password
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"} id="password" placeholder="Enter your password"
                        className="w-full px-3 py-2 pr-10 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500" onChange={(e)=>setPassword(e.target.value)} value={password} required
                    />
                    <button type='button' className='absolute right-3 cursor-pointer top-1/2 -translate-y-1/2 text-gray-500' onClick={() => setShowPassword(prev => !prev)}>{!showPassword ?     <FaRegEye /> : <FaRegEyeSlash />}</button>
                </div>
            </div>

            {/* sign up button */}
            
            <div className="mb-4 text-center">
                <button className="cursor-pointer px-3 py-2 bg-transparent text-[#FFD76A] font-semibold justify-center border-2 border-[#A87A22] rounded-lg hover:bg-[#A87A22] hover:text-[#03060C] focus:outline-none focus:ring-2 focus:ring-[#A87A22]"
                    onClick={handleSignin} >
                    Sign In
                </button>
            </div>

            {err && <p className='text-red-500 text-center my-2.5'>*{err}</p>}

            <div className="mb-4 text-center">
                <button type='button' className="text-sm text-[#FFD76A] hover:underline" onClick={() => navigate("/forgot-password")}>
                    Forgot password?
                </button>
            </div>
            
            {/* or */}
            
            <div className="text-center">
                <p className="text-[#6D6C6C] opacity-50">
                    ------------------------ OR ------------------------
                </p>
            </div>
            
            {/* sign up Google button */}
            <div className="mb-4 text-center">
                <p className="inline-flex items-center gap-1 px-3 py-2 bg-transparent text-white font-semibold justify-center rounded-lg cursor-pointer hover:underline hover:decoration-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500" onClick={handleGoogleAuth}
                >
                    <span>Continue with</span>
                    <span className="inline-flex items-center">
                        <FcGoogle className="text-lg" />
                        <span>oogle</span>
                    </span>
                </p>    
            </div>
            
            {/* sign in link */}
            <div className="text-center">
                <p className="text-[#6D6C6C]">
                    <span className='opacity-65'>Don't have an account?</span> <button type='button' className="text-[#FFD76A] cursor-pointer hover:underline" onClick={() => navigate("/signup")}>Sign Up</button>
                </p>
            </div>
        </div>
    </div>
  )
}

export default Signin
