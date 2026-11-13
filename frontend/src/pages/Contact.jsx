import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import Nav from '../components/Nav'
import { serverUrl } from '../App'

const Contact = () => {
  const { userData } = useSelector((state) => state.user)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })

  // Signed-in users get their name and email pre-filled (they can still edit them)
  useEffect(() => {
    if (userData) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || userData.fullName || '',
        email: prev.email || userData.email || '',
      }))
    }
  }, [userData])

  // Each input's id matches a key in formData, so one handler covers all four fields
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatus({ type: '', text: '' })

    if (formData.message.trim().length < 10) {
      return setStatus({ type: 'error', text: 'Message must be at least 10 characters long.' })
    }

    try {
      setLoading(true)
      const { data } = await axios.post(
        `${serverUrl}/api/contact`,
        {
          name: formData.fullName,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
        { withCredentials: true }
      )
      setStatus({ type: 'success', text: data.message })
      // clear only subject and message; name and email are likely to be reused
      setFormData((prev) => ({ ...prev, subject: '', message: '' }))
    } catch (error) {
      setStatus({
        type: 'error',
        text: error.response?.data?.message || 'Something went wrong. Please try again.',
      })
    } finally {
      setLoading(false)
    }
  }

  const inputClass =
    'w-full px-3 py-2 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className='w-full min-h-screen bg-[url("/images/BG_Cosmic.png")] bg-cover bg-center bg-no-repeat flex flex-col items-center py-5 px-4 sm:px-8 lg:px-15'>

      <Nav />

      <form
        onSubmit={handleSubmit}
        className='w-full h-full text-[#ffffff] gap-5 p-5 bg-[#03060C] border-2 border-[#6D6C6C] rounded-lg shadow-xl mt-20'
      >
        <h1 className='w-full text-2xl sm:text-3xl text-center font-bold text-[#ffffff] mb-2'>
          Get in touch with us
        </h1>
        <p className='text-lg text-[#ffffff] text-center mt-2 mb-6 font-medium'>
          Have questions or feedback? We'd love to hear from you!
        </p>

        {/* fullname */}
        <div className="mb-4 flex flex-col gap-2">
          <label htmlFor="fullName" className="block font-medium mb-1">Full Name</label>
          <input
            type="text" id="fullName" placeholder="Enter your full name"
            value={formData.fullName} onChange={handleChange}
            maxLength={80} required className={inputClass}
          />
        </div>

        {/* email */}
        <div className="mb-4 flex flex-col gap-2">
          <label htmlFor="email" className="block font-medium mb-1">Email</label>
          <input
            type="email" id="email" placeholder="Enter your email"
            value={formData.email} onChange={handleChange}
            required className={inputClass}
          />
        </div>

        {/* Subject */}
        <div className="mb-4 flex flex-col gap-2">
          <label htmlFor="subject" className="block font-medium mb-1">Subject</label>
          <input
            type="text" id="subject" placeholder="Enter the subject (optional)"
            value={formData.subject} onChange={handleChange}
            maxLength={120} className={inputClass}
          />
        </div>

        {/* message */}
        <div className="mb-4 flex flex-col gap-2">
          <label htmlFor="message" className="block font-medium mb-1">Your Message</label>
          <textarea
            id="message" placeholder="Enter your message" rows={5}
            value={formData.message} onChange={handleChange}
            minLength={10} maxLength={3000} required
            className={`${inputClass} resize-none`}
          />
        </div>

        {/* success / error feedback */}
        {status.text && (
          <p className={`mb-4 text-center font-medium ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
            {status.text}
          </p>
        )}

        <div className="mb-4 text-center">
          <button
            type="submit" disabled={loading}
            className="cursor-pointer px-3 py-2 bg-transparent text-[#FFD76A] font-semibold border-2 border-[#A87A22] rounded-lg hover:bg-[#A87A22] hover:text-[#03060C] focus:outline-none focus:ring-2 focus:ring-[#A87A22] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default Contact