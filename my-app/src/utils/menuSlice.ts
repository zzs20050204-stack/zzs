import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentKey: '1',    // 菜单KEY
  currentTitle: '首页'
};

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    setMenuKey: (state, action) => {
      state.currentKey = action.payload.key;
      state.currentTitle = action.payload.title;
    }
  }
});

export const { setMenuKey } = menuSlice.actions;
export default menuSlice.reducer;