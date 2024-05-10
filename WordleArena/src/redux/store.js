import { configureStore, applyMiddleware } from "@reduxjs/toolkit";

import userReducer from "./user-slice";
import channelReducer from "./channel-slice";
import gameReducer from "./game-slice";
import socketReducer from "./socket-slice";

import socketMiddleware from "./socket-middleware";

export const store = configureStore({
    reducer: {
        user: userReducer,
        channel: channelReducer,
        game: gameReducer,
        socket: socketReducer
    },
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat([socketMiddleware])
});