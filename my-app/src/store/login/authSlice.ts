import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: sessionStorage.getItem("token") || null,
    username: sessionStorage.getItem("username") || null,
    userId: sessionStorage.getItem("userId") || null,
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      sessionStorage.setItem("token", action.payload);
    },
    clearToken: (state) => {
      state.token = null;
      state.username = null;
      state.userId = null;
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("username");
      sessionStorage.removeItem("userId");
    },
    setUsername: (state, action) => {
      state.username = action.payload;
      sessionStorage.setItem("username", action.payload);
    },
    setUserId: (state, action) => {
      state.userId = action.payload;
      sessionStorage.setItem("userId", String(action.payload));
    },
  },
});

export const { setToken, clearToken, setUsername, setUserId } = authSlice.actions;
export default authSlice.reducer;