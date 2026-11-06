import React, { useState, useEffect } from 'react'
import Nav from '../components/Nav'
import { CgProfile } from "react-icons/cg";
import { FaPen } from "react-icons/fa";
import { FaKey } from "react-icons/fa6";
import { RiChatDeleteFill } from "react-icons/ri";
import { FiLogOut } from "react-icons/fi";
import { FaTrash } from "react-icons/fa6";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { serverUrl } from "../App";
import { logout, updateUserData } from "../redux/userSlice";
import { clearChats } from "../redux/chatSlice";

const inputClass =
  'w-full px-3 py-2 border rounded-lg bg-transparent border-[#6D6C6C] text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
const goldBtn =
  'cursor-pointer px-4 py-2 text-[#FFD76A] font-semibold border-2 border-[#A87A22] rounded-lg hover:bg-[#A87A22] hover:text-[#03060C] disabled:opacity-60 disabled:cursor-not-allowed'
const grayBtn = 'cursor-pointer px-4 py-2 border-2 border-[#6D6C6C] rounded-lg'

// Defined OUTSIDE Profile on purpose: a component declared inside another is re-created
// on every render, which makes inputs lose focus while typing.
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

const Profile = () => {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [modal, setModal] = useState(null) // null | 'edit' | 'password' | 'clear' | 'delete'
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })

  const [fullName, setFullName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteText, setDeleteText] = useState('')

  const [hasChats, setHasChats] = useState(false) // is there any chat history to clear?

  // When the page opens, ask the server whether this user has any chats.
  // (The Redux list from the Chat page is not used: it is empty if that page
  // was never opened, and it can be filtered by a search.)
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
    return () => { 
      cancelled = true 
    }
    }, [])

  const openModal = (name) => {
    setStatus({ type: '', text: '' })
    setFullName(userData?.fullName || '')
    setAvatarFile(null)
    setAvatarPreview('')
    setPw({ currentPassword: '', newPassword: '', confirmPassword: '' })
    setDeletePassword('')
    setDeleteText('')
    setModal(name)
  }
  const closeModal = () => setModal(null)

  const errorText = (error) =>
    error.response?.data?.message || 'Something went wrong. Please try again.'

  // shared by logout and delete account
  const endSession = async (redirectTo) => {
    try { await signOut(auth) } catch (e) { /* no Firebase session for email users */ }
    dispatch(logout())
    navigate(redirectTo, { replace: true })
  }

  const handleSignout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
    } catch (error) {
      console.error(error)
    } finally {
      endSession('/signin')
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      return setStatus({ type: 'error', text: 'Image must be under 2 MB.' })
    }
    setStatus({ type: '', text: '' })
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file)) // local preview, nothing uploaded yet
  }

  const handleEdit = async (e) => {
    e.preventDefault()
    try {
      setLoading(true)
      const changes = {}

      if (fullName.trim() !== userData.fullName) {
        const { data } = await axios.patch(
          `${serverUrl}/api/user/profile`, { fullName }, { withCredentials: true }
        )
        changes.fullName = data.fullName
      }

      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile) // must match upload.single("avatar") on the server
        const { data } = await axios.patch(
          `${serverUrl}/api/user/avatar`, formData, { withCredentials: true }
        )
        changes.avatar = data.avatar
      }

      if (Object.keys(changes).length) dispatch(updateUserData(changes))
      closeModal()
    } catch (error) {
      setStatus({ type: 'error', text: errorText(error) })
    } finally {
      setLoading(false)
    }
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
      dispatch(clearChats()) // empties the sidebar and open chat in Redux too
      setHasChats(false)     // nothing left to clear: disables the button
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
      endSession('/')
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

        <h1 className='w-full text-3xl font-bold text-[#ffffff] text-left pl-8'>Profile</h1>

        <div className='w-full h-full flex items-center justify-center gap-5 p-5 bg-[#03060C] border-2 border-[#6D6C6C] rounded-lg shadow-xl'>

          {/* left div */}
          <div className='w-2/5 h-full flex flex-col items-center justify-center gap-5 border-r border-[#6D6C6C]/40 mr-8'>
            {hasRealAvatar ? (
              <img src={avatarUrl} alt='avatar' className='w-24 h-24 rounded-full object-cover border-2 border-[#A87A22]' />
            ) : (
              <CgProfile size={50} className='text-[#FFFFFF]' />
            )}
            <p className='text-[#FFFFFF] text-2xl font-bold'>{userData?.fullName}</p>
            <p className='text-[#FFFFFF] text-lg break-all text-center'>{userData?.email}</p>
            <button
              onClick={() => openModal('edit')}
              className='cursor-pointer flex items-center gap-2 rounded-lg py-2 px-4 text-[#FFD76A] border-2 border-[#A87A22] hover:bg-[#A87A22] hover:text-[#03060C]'
            >
              Edit Profile<FaPen />
            </button>
          </div>

          {/* right div */}
          <div className='w-3/5 h-full flex flex-col text-[#FFFFFF] items-start justify-start gap-5 p-5 rounded-lg'>
            {/* Google-only accounts have no password to change */}
            {userData?.hasPassword && (
              <div onClick={() => openModal('password')} className='cursor-pointer border-2 border-[#6D6C6C] font-bold text-lg p-2 rounded-2xl w-full flex'>
                <FaKey className='m-1.5' />Change Password
              </div>
            )}
            <button
              type='button'
              disabled={!hasChats}
              title={hasChats ? '' : 'No chat history to clear'}
              onClick={() => openModal('clear')}
              className='cursor-pointer border-2 border-[#6D6C6C] font-bold text-lg p-2 rounded-2xl w-full flex disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <RiChatDeleteFill className='m-1.5' />Clear Chat History
            </button>
            <div className='cursor-pointer border-2 border-[#6D6C6C] font-bold text-[#fc0e0e] text-lg p-2 rounded-2xl w-full flex' onClick={handleSignout}>
              <FiLogOut className='m-1.5' />Log Out
            </div>
            <div onClick={() => openModal('delete')} className='cursor-pointer border-2 border-[#6D6C6C] font-bold text-[#fc0e0e] text-lg p-2 rounded-2xl w-full flex'>
              <FaTrash className='m-1.5' />Delete Account
            </div>
          </div>

        </div>
      </div>

      {/* Edit profile */}
      {modal === 'edit' && (
        <Modal title='Edit Profile' onClose={closeModal}>
          <form onSubmit={handleEdit} className='flex flex-col gap-3'>
            <div className='flex flex-col items-center gap-2'>
              {avatarPreview || hasRealAvatar ? (
                <img src={avatarPreview || avatarUrl} alt='avatar preview'
                  className='w-24 h-24 rounded-full object-cover border-2 border-[#A87A22]' />
              ) : (
                <CgProfile size={80} className='text-[#FFFFFF]' />
              )}
              <label htmlFor='avatarInput' className='cursor-pointer text-[#FFD76A] underline'>
                Change photo
              </label>
              <input id='avatarInput' type='file' accept='image/png,image/jpeg,image/webp'
                onChange={handleAvatarChange} className='hidden' />
            </div>

            <label htmlFor='fullName' className='font-medium'>Full Name</label>
            <input id='fullName' value={fullName} onChange={(e) => setFullName(e.target.value)}
              maxLength={80} required className={inputClass} />

            <label className='font-medium'>Email</label>
            <input value={userData?.email || ''} disabled className={`${inputClass} opacity-60`} />

            {renderStatus()}
            <div className='flex justify-end gap-3'>
              <button type='button' onClick={closeModal} className={grayBtn}>Cancel</button>
              <button type='submit' disabled={loading} className={goldBtn}>{loading ? 'Saving...' : 'Save'}</button>
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
              <button type='submit' disabled={loading} className={goldBtn}>{loading ? 'Clearing...' : 'Clear'}</button>
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

export default Profile