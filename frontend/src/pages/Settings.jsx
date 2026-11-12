import React, { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import { CgProfile } from "react-icons/cg";
import { FaPen, FaKey, FaTrash, FaChevronRight } from "react-icons/fa6";
import { RiChatDeleteFill } from "react-icons/ri";
import { IoArrowBackCircleOutline } from "react-icons/io5";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { serverUrl } from "../App";
import { logout } from "../redux/userSlice";
import { clearChats } from "../redux/chatSlice";

const inputClass =
  'w-full px-3 py-2 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
const goldBtn =
  'cursor-pointer px-4 py-2 text-[#FFD76A] font-semibold border-2 border-[#A87A22] rounded-lg hover:bg-[#A87A22] hover:text-[#03060C] disabled:opacity-60 disabled:cursor-not-allowed'
const grayBtn = 'cursor-pointer px-4 py-2 border-2 border-[#6D6C6C] rounded-lg'

const LANGUAGES = ['English', 'हिन्दी', 'मराठी']

// Defined OUTSIDE Settings so inputs don't lose focus while typing.
const Modal = ({ title, onClose, children }) => (
  <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4' onClick={onClose}>
    <div
      className='w-full max-w-md bg-[#03060C] border-2 border-[#6D6C6C] rounded-lg p-6 text-white'
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className='text-2xl font-bold mb-4'>{title}</h2>
      {children}
    </div>
  </div>
)

const Row = ({ icon, label, onClick, danger = false, showArrow = false, disabled = false, title }) => (
  <button
    type='button'
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={`cursor-pointer w-full flex items-center gap-3 border-2 border-[#6D6C6C] rounded-xl px-4 py-3 font-bold text-lg hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent ${
      danger ? 'text-[#fc0e0e]' : 'text-white'
    }`}
  >
    {icon}
    <span className='flex-1 text-left'>{label}</span>
    {showArrow && <FaChevronRight className='text-[#6D6C6C]' size={16} />}
  </button>
)

const Settings = () => {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [modal, setModal] = useState(null) // null | 'language' | 'password' | 'clear' | 'delete'
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })

  const [language, setLanguage] = useState(() => localStorage.getItem('language') || 'English')
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteText, setDeleteText] = useState('')
  const [hasChats, setHasChats] = useState(false)

  // Ask the server whether this user has any chats (same logic as before)
  useEffect(() => {
    let cancelled = false
    const checkChats = async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/chat`, { withCredentials: true })
        if (!cancelled) setHasChats(data.chats.length > 0)
      } catch (error) {
        console.error(error)
      }
    }
    checkChats()
    return () => { cancelled = true }
  }, [])

  const openModal = (name) => {
    setStatus({ type: '', text: '' })
    setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setDeletePassword('')
    setDeleteText('')
    setModal(name)
  }
  const closeModal = () => setModal(null)

  const errorText = (error) =>
    error.response?.data?.message || 'Something went wrong. Please try again.'

  const handleLanguage = (e) => {
    e.preventDefault()
    localStorage.setItem('language', language) // preference only; no translation yet
    closeModal()
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const { data } = await axios.patch(
        `${serverUrl}/api/user/change-password`, pw, { withCredentials: true }
      )
      setStatus({ type: 'success', text: data.message })
      setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setStatus({ type: 'error', text: errorText(error) })
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      await axios.delete(`${serverUrl}/api/chat`, { withCredentials: true })
      dispatch(clearChats())
      setHasChats(false)
      setStatus({ type: 'success', text: 'Chat history cleared.' })
    } catch (error) {
      setStatus({ type: 'error', text: errorText(error) })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      // axios.delete sends a body through the config's `data` key
      await axios.delete(`${serverUrl}/api/user/account`, {
        data: { password: deletePassword },
        withCredentials: true,
      })
      try { await signOut(auth) } catch (err) { /* no Firebase session for email users */ }
      dispatch(logout())
      navigate('/', { replace: true })
    } catch (error) {
      setStatus({ type: 'error', text: errorText(error) })
      setLoading(false)
    }
  }

  const avatarUrl = userData?.avatar?.url
  const hasRealAvatar = avatarUrl && !avatarUrl.includes('placehold.co')
  const deleteReady = userData?.hasPassword ? deletePassword.length > 0 : deleteText === 'DELETE'

  const renderStatus = () =>
    status.text ? (
      <p className={`mb-3 text-center font-medium ${status.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
        {status.text}
      </p>
    ) : null

  return (
    <div className='w-full min-h-screen bg-[url("/images/BG_Cosmic.png")] bg-cover bg-center bg-no-repeat flex flex-col items-center py-5 px-15'>

      <Nav />

      <div className='w-full h-full flex flex-col items-center justify-center gap-5 p-5 bg-[#03060C] border-2 border-[#6D6C6C] rounded-lg shadow-xl mt-20'>

        {/* header with back arrow */}
        <div className='w-full flex items-center gap-3 pl-8'>
          <button type='button' onClick={() => navigate(-1)} aria-label='Back' className='cursor-pointer text-white'>
            <IoArrowBackCircleOutline size={32} />
          </button>
          <h1 className='text-3xl font-bold text-[#ffffff]'>Settings</h1>
        </div>

        <div className='w-full h-full flex items-center justify-center gap-5 p-5 bg-[#03060C] border-2 border-[#6D6C6C] rounded-lg shadow-xl'>

          {/* left: user info */}
          <div className='w-2/5 h-full flex flex-col items-center justify-center gap-4 border-r border-[#6D6C6C]/40 mr-8'>
            {hasRealAvatar ? (
              <img src={avatarUrl} alt='avatar' className='w-24 h-24 rounded-full object-cover border-2 border-[#A87A22]' />
            ) : (
              <CgProfile size={50} className='text-[#FFFFFF]' />
            )}
            <p className='text-[#FFFFFF] text-2xl font-bold'>{userData?.fullName}</p>
            <p className='text-[#9a9a9a] text-lg break-all text-center'>{userData?.email}</p>
          </div>

          {/* right: settings */}
          <div className='w-3/5 h-full flex flex-col items-start justify-start gap-4 p-5'>

            <p className='text-[#9a9a9a] text-sm'>Language</p>
            <Row icon={<FaPen />} label={language} showArrow onClick={() => openModal('language')} />

            <p className='text-[#9a9a9a] text-sm mt-2'>Security</p>
            {/* Google-only accounts have no password to change */}
            {userData?.hasPassword && (
              <Row icon={<FaKey />} label='Change Password' onClick={() => openModal('password')} />
            )}
            <Row
              icon={<RiChatDeleteFill />}
              label='Clear Chat History'
              disabled={!hasChats}
              title={hasChats ? '' : 'No chat history to clear'}
              onClick={() => openModal('clear')}
            />
            <Row icon={<FaTrash />} label='Delete Account' danger onClick={() => openModal('delete')} />
          </div>

        </div>
      </div>

      {/* Language */}
      {modal === 'language' && (
        <Modal title='Language' onClose={closeModal}>
          <form onSubmit={handleLanguage} className='flex flex-col gap-3'>
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className={`${inputClass} bg-[#03060C]`}>
              {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            <div className='flex justify-end gap-3'>
              <button type='button' onClick={closeModal} className={grayBtn}>Cancel</button>
              <button type='submit' className={goldBtn}>Save</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Change password */}
      {modal === 'password' && (
        <Modal title='Change Password' onClose={closeModal}>
          <form onSubmit={handlePassword} className='flex flex-col gap-3'>
            {['currentPassword', 'newPassword', 'confirmPassword'].map((key) => (
              <input key={key} type='password' required className={inputClass}
                placeholder={{ currentPassword: 'Current password', newPassword: 'New password (min 8 characters)', confirmPassword: 'Confirm new password' }[key]}
                value={pw[key]} onChange={(e) => setPw((p) => ({ ...p, [key]: e.target.value }))} />
            ))}
            {renderStatus()}
            <div className='flex justify-end gap-3'>
              <button type='button' onClick={closeModal} className={grayBtn}>Close</button>
              <button type='submit' disabled={loading} className={goldBtn}>{loading ? 'Updating...' : 'Update'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Clear chat history */}
      {modal === 'clear' && (
        <Modal title='Clear Chat History' onClose={closeModal}>
          <form onSubmit={handleClearChat} className='flex flex-col gap-3'>
            <p className='text-[#fc0e0e] font-medium'>All your conversations with Krishna will be deleted. This cannot be undone.</p>
            {renderStatus()}
            <div className='flex justify-end gap-3'>
              <button type='button' onClick={closeModal} className={grayBtn}>Close</button>
              <button type='submit' disabled={loading || !hasChats} className={goldBtn}>{loading ? 'Clearing...' : 'Clear'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete account */}
      {modal === 'delete' && (
        <Modal title='Delete Account' onClose={closeModal}>
          <form onSubmit={handleDelete} className='flex flex-col gap-3'>
            <p className='text-[#fc0e0e] font-medium'>This permanently deletes your account and cannot be undone.</p>
            {userData?.hasPassword ? (
              <input type='password' placeholder='Enter your password to confirm' required
                value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} className={inputClass} />
            ) : (
              <input placeholder='Type DELETE to confirm' required
                value={deleteText} onChange={(e) => setDeleteText(e.target.value)} className={inputClass} />
            )}
            {renderStatus()}
            <div className='flex justify-end gap-3'>
              <button type='button' onClick={closeModal} className={grayBtn}>Cancel</button>
              <button type='submit' disabled={loading || !deleteReady}
                className='cursor-pointer px-4 py-2 text-white font-semibold bg-[#fc0e0e] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed'>
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </form>
        </Modal>
      )}

    </div>
  )
}

export default Settings