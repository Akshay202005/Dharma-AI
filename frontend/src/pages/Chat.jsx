import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router'
import { RxHamburgerMenu } from 'react-icons/rx'
import { FiSearch, FiSend, FiMic, FiPlusCircle, FiTrash2, FiX, FiVolume2, FiVolumeX } from 'react-icons/fi'
import useSpeech from '../hooks/useSpeech'
import useLimit from '../hooks/useLimit'
import Nav from '../components/Nav'
import { serverUrl } from '../App'
import {
  setChats, setActiveChatId, setMessages, addMessage,
  removeMessage, upsertChat, removeChat,
} from '../redux/chatSlice'

const Chat = () => {
  const { chatId } = useParams() // from the route "/chat/:chatId?"
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { chats, activeChatId, messages } = useSelector((state) => state.chat)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [search, setSearch] = useState('')
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingChat, setLoadingChat] = useState(false)
  const [listening, setListening] = useState(false)
  const [error, setError] = useState('')

  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  const { speak, stop, toggleMute, muted, speaking } = useSpeech()

  // AI limit: `limit.active` is true while every AI model is out of quota
  const limit = useLimit()

  const errorText = (err) => err.response?.data?.message || 'Something went wrong. Please try again.'

  // ---------- sidebar list (reloads when the search text changes) ----------
  useEffect(() => {
    // debounce: wait 300ms after the last keystroke before calling the API
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get(`${serverUrl}/api/chat`, {
          params: { q: search },
          withCredentials: true,
        })
        dispatch(setChats(data.chats))
      } catch (err) {
        console.error(err)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search, dispatch])

  // ---------- open a conversation when the URL changes ----------
  useEffect(() => {
    if (!chatId) {
      // "/chat" = a fresh, empty conversation
      dispatch(setActiveChatId(null))
      dispatch(setMessages([]))
      return
    }
    // already open (for example we just created it by sending the first message)
    if (chatId === activeChatId) return

    let cancelled = false // ignore a slow response if the user already opened another chat
    const loadChat = async () => {
      try {
        setLoadingChat(true)
        setError('')
        const { data } = await axios.get(`${serverUrl}/api/chat/${chatId}`, { withCredentials: true })
        if (cancelled) return
        dispatch(setMessages(data.messages))
        dispatch(setActiveChatId(chatId))
      } catch (err) {
        if (!cancelled) navigate('/chat', { replace: true }) // chat missing or not yours
      } finally {
        if (!cancelled) setLoadingChat(false)
      }
    }
    loadChat()
    return () => {
      cancelled = true
      setLoadingChat(false) // otherwise 'Loading...' could stay on screen after switching chats
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId])

  // keep the newest message in view
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  // stop the microphone if the user leaves the page
  useEffect(() => () => recognitionRef.current?.stop(), [])

  // ---------- send a message ----------
  const handleSend = async (e) => {
    e.preventDefault()
    const content = input.trim()
    if (!content || sending || limit.active) return

    setError('')
    setSending(true)
    setInput('')

    // show the user's message immediately; the real one is saved by the server
    const tempId = `temp-${Date.now()}`
    dispatch(addMessage({ _id: tempId, sender: 'User', content }))

    try {
      const { data } = await axios.post(
        `${serverUrl}/api/chat/message`,
        { chatId: activeChatId, content },
        { withCredentials: true }
      )

      dispatch(addMessage(data.krishnaMessage))
      dispatch(upsertChat(data.chat))
      speak(data.krishnaMessage) // pass the whole message so the hook can read its _id

      if (!activeChatId) {
        // first message of a new chat: set the id BEFORE navigating so the
        // effect above does not re-fetch what we already have
        dispatch(setActiveChatId(data.chat._id))
        navigate(`/chat/${data.chat._id}`, { replace: true })
      }
    } catch (err) {
      dispatch(removeMessage(tempId))
      setInput(content) // give the text back so nothing is lost
      if (err.response?.status === 429 && err.response.data?.code === 'AI_LIMIT') {
        // every AI model is out of quota: show the banner instead of an error
        limit.setResetsAt(Number(err.response.data.resetsAt))
      } else {
        setError(errorText(err))
      }
    } finally {
      setSending(false)
    }
  }

  // ---------- voice input (browser Speech Recognition, works in Chrome/Edge) ----------
  const toggleMic = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      return setError('Voice input is not supported in this browser. Please use Chrome or Edge.')
    }
    if (listening) {
      recognitionRef.current?.stop()
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.onresult = (e) => {
      const spoken = e.results[0][0].transcript
      setInput((prev) => (prev ? `${prev} ${spoken}` : spoken))
    }
    recognition.onerror = () => setError('Could not hear you. Check your microphone permission.')
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  // ---------- sidebar actions ----------
  const handleNewChat = () => { stop(); navigate('/chat') }

  const handleDeleteChat = async (e, id) => {
    e.stopPropagation() // don't open the chat we are deleting
    try {
      await axios.delete(`${serverUrl}/api/chat/${id}`, { withCredentials: true })
      dispatch(removeChat(id))
      if (id === activeChatId) navigate('/chat')
    } catch (err) {
      setError(errorText(err))
    }
  }

  return (
    <div className='w-full min-h-screen bg-[url("/images/BG_Cosmic.png")] bg-cover bg-center bg-no-repeat flex flex-col items-center py-5 px-15'>

      <Nav />

      <div className='w-full flex-1 mt-24 flex gap-5 items-start'>

        {/* Sidebar (open) or just the hamburger (closed) */}
        {sidebarOpen ? (
          <aside className='w-64 shrink-0 h-[calc(100vh-15rem)] min-h-105 flex flex-col bg-[#03060C]/90 border-2 border-[#6D6C6C] rounded-2xl p-4 text-white'>
            <div className='flex items-center justify-between mb-5'>
              <button onClick={() => setSidebarOpen(false)} aria-label='Close sidebar' className='cursor-pointer'>
                <RxHamburgerMenu size={24} />
              </button>
              <button
                onClick={() => { setShowSearch((s) => !s); setSearch('') }}
                aria-label='Search chats'
                className='cursor-pointer'
              >
                {showSearch ? <FiX size={22} /> : <FiSearch size={22} />}
              </button>
            </div>

            {showSearch && (
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder='Search chats'
                className='mb-4 w-full px-3 py-1.5 text-sm bg-transparent border border-[#6D6C6C] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#A87A22]'
              />
            )}

            <button onClick={handleNewChat} className='cursor-pointer flex items-center gap-3 text-left pb-4 border-b border-[#6D6C6C]/50 hover:text-[#FFD76A]'>
              <FiPlusCircle size={22} />New Chat
            </button>

            <p className='mt-4 mb-2 font-medium'>Chat History</p>
            <ul className='flex-1 overflow-y-auto pr-1 flex flex-col gap-0.5'>
              {chats.length === 0 && (
                <li className='text-sm text-[#9a9a9a] py-2'>
                  {search ? 'No chats match your search.' : 'No conversations yet. Share what is on your mind.'}
                </li>
              )}
              {chats.map((c) => (
                <li
                  key={c._id}
                  onClick={() => { stop(); navigate(`/chat/${c._id}`) }}
                  className={`group cursor-pointer flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-sm hover:bg-white/10 ${c._id === activeChatId ? 'bg-white/10 text-[#FFD76A]' : ''}`}
                >
                  <span className='truncate'>{c.title}</span>
                  <button
                    onClick={(e) => handleDeleteChat(e, c._id)}
                    aria-label={`Delete chat ${c.title}`}
                    className='cursor-pointer shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 text-[#fc0e0e]'
                  >
                    <FiTrash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </aside>
        ) : (
          <button onClick={() => setSidebarOpen(true)} aria-label='Open sidebar' className='cursor-pointer text-white mt-1 shrink-0'>
            <RxHamburgerMenu size={24} />
          </button>
        )}

        {/* Chat panel */}
        <section className='flex-1 min-w-0 h-[calc(100vh-15rem)] min-h-105 flex flex-col bg-[#03060C] border-2 border-white rounded-2xl p-4 text-white'>
          <h1 className='text-center text-xl underline underline-offset-4 mb-3'>Chat</h1>

          <div className='flex-1 overflow-y-auto pr-2 flex flex-col gap-4'>
            {loadingChat && <p className='text-center text-sm text-[#9a9a9a]'>Loading conversation...</p>}

            {!loadingChat && messages.length === 0 && (
              <p className='m-auto text-center text-[#9a9a9a] max-w-xs'>
                Tell Krishna what is troubling you. He will listen and guide you with the wisdom of the Gita.
              </p>
            )}

            {messages.map((m) =>
              m.sender === 'User' ? (
                <div key={m._id} className='flex flex-col items-end'>
                  <span className='text-[10px] text-blue-400'>You</span>
                  <p className='max-w-[85%] text-sm text-right whitespace-pre-wrap wrap-break'>{m.content}</p>
                </div>
              ) : (
                <div key={m._id} className='flex flex-col items-start'>
                  <span className='text-[10px] text-[#FFD76A]'>Krishna</span>
                  <p className='max-w-[85%] text-sm whitespace-pre-wrap wrap-break'>{m.content}</p>
                  {m.reference && <span className='mt-1 text-[11px] text-[#A87A22]'>{m.reference}</span>}
                  <button
                    type='button'
                    onClick={() => speak(m)}
                    aria-label='Play voice'
                    className='mt-1 cursor-pointer text-[#FFD76A] hover:opacity-80'
                  >
                    <FiVolume2 size={16} />
                  </button>
                </div>
              )
            )}

            {sending && (
              <div className='flex flex-col items-start'>
                <span className='text-[10px] text-[#FFD76A]'>Krishna</span>
                <p className='text-sm text-[#9a9a9a] animate-pulse'>Krishna is reflecting...</p>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </section>

        {/* Krishna image panel (hidden on small screens) */}
        <section className='hidden md:block relative flex-1 min-w-0 h-[calc(100vh-15rem)] min-h-105 p-2 border-2 border-white rounded-2xl'>
          <div className='w-full h-full overflow-hidden rounded-xl'>
            <img
              src='/images/Krishna.png'
              alt='Krishna'
              className={`w-full h-full object-cover transition-transform duration-700 ${speaking ? 'scale-105' : 'scale-100'}`}
            />
          </div>
          <button
            type='button'
            onClick={toggleMute}
            aria-label={muted ? 'Unmute Krishna' : 'Mute Krishna'}
            className='absolute top-5 left-5 w-10 h-10 rounded-xl flex items-center justify-center border border-white/80 bg-black/45 text-[#FFD76A] cursor-pointer hover:bg-black/60'
          >
            {muted ? <FiVolumeX size={20} /> : <FiVolume2 size={20} />}
          </button>
        </section>
      </div>

      {/* Input bar */}
            {/* Input bar */}
      <div className='w-full max-w-2xl mt-5'>
        {error && <p role='alert' className='mb-2 text-center text-red-400 font-medium'>{error}</p>}

        {limit.active ? (
          // Every AI model is out of quota: the message replaces the input box
          <div role='alert' className='flex items-center justify-center px-5 py-3 bg-[#03060C] border-2 border-white rounded-2xl'>
            <p className='text-lg text-[#FFD76A] text-center'>{limit.label}</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className='flex items-center gap-3 px-5 py-3 bg-[#03060C] border-2 border-white rounded-2xl'>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={4000}
              placeholder='Share your problems with Krishna...'
              className='flex-1 bg-transparent text-white text-lg placeholder:text-[#bdbdbd] focus:outline-none'
            />
            <button
              type='button'
              onClick={toggleMic}
              aria-label={listening ? 'Stop voice input' : 'Start voice input'}
              className={`cursor-pointer ${listening ? 'text-[#fc0e0e] animate-pulse' : 'text-white'}`}
            >
              <FiMic size={22} />
            </button>
            <button
              type='submit'
              disabled={sending || !input.trim()}
              aria-label='Send message'
              className='cursor-pointer text-white disabled:opacity-40 disabled:cursor-not-allowed'
            >
              <FiSend size={22} />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default Chat