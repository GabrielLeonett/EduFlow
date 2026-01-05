import { configureStore } from "@reduxjs/toolkit";
import cacheReducer from "../cache/cacheSlice";

export const store = configureStore({
  reducer: {
    cache: cacheReducer,
  },
});

export default store;
