import { createSlice } from "@reduxjs/toolkit";

const userFromStorage = (() => {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
})();

const initialState = {
  user: userFromStorage,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;

      localStorage.setItem("user", JSON.stringify(action.payload));
    },

    logout: (state) => {
      state.user = null;
      localStorage.removeItem("user");
    },
  },
});

export const { setUser, logout } = authSlice.actions;

export const selectLoggedInUser = (state) => state?.auth?.user ?? null;

export default authSlice.reducer;
