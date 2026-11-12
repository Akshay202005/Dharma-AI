import React, { useState } from 'react'
import Nav from '../components/Nav'
import { CgProfile } from "react-icons/cg";
import { FaPen, FaCog, FaQuestionCircle, FaChevronRight } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import { serverUrl } from "../App";
import { logout, updateUserData } from "../redux/userSlice";

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

// One menu row (icon + label + optional arrow). Used for every option on the right side.
const Row = ({ icon, label, onClick, danger = false, showArrow = false }) => (
  <button
    type='button'
    onClick={onClick}
    className={`cursor-pointer w-full flex items-center gap-3 border-2 border-[#6D6C6C] rounded-xl px-4 py-3 font-bold text-lg hover:bg-white/5 ${
      danger ? 'text-[#fc0e0e]' : 'text-white'
    }`}
  >
    {icon}
    <span className='flex-1 text-left'>{label}</span>
    {showArrow && <FaChevronRight className='text-[#6D6C6C]' size={16} />}
  </button>
)

const Profile = () => {
  const { userData } = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [modal, setModal] = useState(null) // null | 'edit'
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState({ type: '', text: '' })

  const [fullName, setFullName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  const openModal = (name) => {
    setStatus({ type: '', text: '' })
    setFullName(userData?.fullName || '')
    setAvatarFile(null)
    setAvatarPreview('')
    setModal(name)
  }
  const closeModal = () => setModal(null)

  const errorText = (error) =>
    error.response?.data?.message || 'Something went wrong. Please try again.'

  const handleSignout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
    } catch (error) {
      console.error(error)
    } finally {
      try { await signOut(auth) } catch (e) { /* no Firebase session for email users */ }
      dispatch(logout())
      navigate('/signin', { replace: true })
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

  const avatarUrl = userData?.avatar?.url
  const hasRealAvatar = avatarUrl && !avatarUrl.includes('placehold.co')

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

          {/* right: menu */}
          <div className='w-3/5 h-full flex flex-col items-start justify-start gap-4 p-5'>
            <Row icon={<FaPen />} label='Edit Profile' showArrow onClick={() => openModal('edit')} />
            <Row icon={<FaCog />} label='Settings' showArrow onClick={() => navigate('/settings')} />
            <Row icon={<FaQuestionCircle />} label='Help' onClick={() => navigate('/contact')} />
            <Row icon={<FiLogOut />} label='Log Out' danger onClick={handleSignout} />
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

    </div>
  )
}

export default Profile