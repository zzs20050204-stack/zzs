import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: sessionStorage.getItem("token") || null,
    username: sessionStorage.getItem("username") || null,
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      sessionStorage.setItem("token", action.payload);
    },
    clearToken: (state) => {
      state.token = null;
      state.username = null;
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("username");
    },
    setUsername: (state, action) => {
      state.username = action.payload;
      sessionStorage.setItem("username", action.payload);
    },
  },
});

export const { setToken, clearToken, setUsername } = authSlice.actions;
export default authSlice.reducer;