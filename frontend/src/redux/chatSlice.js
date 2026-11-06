import { createSlice } from "@reduxjs/toolkit";
import { logout } from "./userSlice.js";

const initialState = {
  chats: [],            // sidebar list: [{ _id, title, emotion, updatedAt }]
  activeChatId: null,   // conversation currently open (null = new, unsent chat)
  messages: [],         // messages of the active conversation
}

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload
    },
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload
    },
    setMessages: (state, action) => {
      state.messages = action.payload
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload)
    },
    removeMessage: (state, action) => {
      // undo the instantly-shown user message if sending fails
      state.messages = state.messages.filter((m) => m._id !== action.payload)
    },
    upsertChat: (state, action) => {
      // add or update a chat and move it to the top of the sidebar
      state.chats = [action.payload, ...state.chats.filter((c) => c._id !== action.payload._id)]
    },
    removeChat: (state, action) => {
      state.chats = state.chats.filter((c) => c._id !== action.payload)
    },
    clearChats: () => initialState,
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState)
  },
})

export const {
  setChats, setActiveChatId, setMessages, addMessage,
  removeMessage, upsertChat, removeChat, clearChats,
} = chatSlice.actions
export default chatSlice.reducer