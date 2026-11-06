import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice.js";
import chatSlice from "./chatSlice.js";

export const store = configureStore({
  reducer: {
    user: userSlice,
    chat: chatSlice,
  }
})