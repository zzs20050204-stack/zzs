import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./login/authSlice";
// 👇 加入我们的菜单切片
import menuSlice from "../utils/menuSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,       // 你原来的登录
    menu: menuSlice,       // 新增菜单控制
  },
});

// 导出类型，给组件使用
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;