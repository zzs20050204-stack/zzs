import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./login/authSlice";
import menuSlice from "../utils/menuSlice";
import { persistReducer, persistStore } from 'redux-persist';
// 导入sessionStorage
import storageSession from 'redux-persist/lib/storage/session';

// menu持久化配置，存储到sessionStorage
const menuPersistConfig = {
  key: 'menu',
  storage: storageSession,
};
const persistedMenuReducer = persistReducer(menuPersistConfig, menuSlice);

export const store = configureStore({
  reducer: {
    auth: authSlice,
    menu: persistedMenuReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;