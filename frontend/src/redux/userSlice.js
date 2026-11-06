import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    userData: null,          // { _id, fullName, email, avatar: { url, localPath }, ... }
    isAuthenticated: false,
    authChecked: false,      // true once the "am I logged in?" check has finished
    resetEmail: null,        // carries the email across the 3 forgot-password pages
  },
  reducers: {
    setUserData: (state, action) => {
      state.userData = action.payload
      state.isAuthenticated = !!action.payload
    },
    setAuthChecked: (state, action) => {
      state.authChecked = action.payload
    },
    updateUserData: (state, action) => {
      // merge only the changed fields (e.g. avatar or fullName after a profile edit)
      if (state.userData) {
        state.userData = { ...state.userData, ...action.payload }
      }
    },
    setResetEmail: (state, action) => {
      state.resetEmail = action.payload
    },
    logout: (state) => {
      state.userData = null
      state.isAuthenticated = false
      state.resetEmail = null
    }
  }
})

export const { setUserData, setAuthChecked, updateUserData, setResetEmail, logout } = userSlice.actions
export default userSlice.reducer