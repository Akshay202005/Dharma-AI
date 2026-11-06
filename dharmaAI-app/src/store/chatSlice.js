import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    chats: [],          // sidebar history: [{ _id, title, emotion, updatedAt }]
    activeChatId: null, // null = new chat (not created on the backend yet)
    messages: [],       // messages of the open chat
    isSending: false,   // true while waiting for Krishna's reply
  },
  reducers: {
    setChats: (state, action) => {
      state.chats = action.payload;
    },
    // new chat -> added on top; existing chat -> moved to top (backend bumps updatedAt)
    upsertChat: (state, action) => {
      state.chats = state.chats.filter((c) => c._id !== action.payload._id);
      state.chats.unshift(action.payload);
    },
    removeChat: (state, action) => {
      state.chats = state.chats.filter((c) => c._id !== action.payload);
    },
    setActiveChatId: (state, action) => {
      state.activeChatId = action.payload;
    },
    setMessages: (state, action) => {
      state.messages = action.payload;
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    removeMessage: (state, action) => {
      state.messages = state.messages.filter((m) => m._id !== action.payload);
    },
    setIsSending: (state, action) => {
      state.isSending = action.payload;
    },
    // call on logout / account delete so the next user never sees old chats
    resetChat: (state) => {
      state.chats = [];
      state.activeChatId = null;
      state.messages = [];
      state.isSending = false;
    },
    updateChatTitle: (state, action) => {
      const chat = state.chats.find((c) => c._id === action.payload._id);
      if (chat) chat.title = action.payload.title;
    },
  },
});

export const {
  setChats,
  upsertChat,
  removeChat,
  updateChatTitle,
  setActiveChatId,
  setMessages,
  addMessage,
  removeMessage,
  setIsSending,
  resetChat,
} = chatSlice.actions;

export default chatSlice.reducer;