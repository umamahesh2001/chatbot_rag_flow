import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import chatReducer from "./chatSlice";
import emailReducer from "./emailSlice";
import gmailReducer from "./gmailSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    email: emailReducer,
    gmail: gmailReducer,
  },
});
