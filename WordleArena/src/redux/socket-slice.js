import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    connected: false,
    message: null
}

export const socketSlice = createSlice({
    name: "socket",
    initialState,
    reducers: {
        connect: (state) => {
            state.message = "Websocket bağlantısı kuruluyor";
        },
        connectionEstablished: (state) => {
            state.connected = true;
            state.message = "Websocket bağlantısı kuruldu";
        },
        connectionFailed: (state) => {
            state.connected = false;
            state.message = "Websocket bağlantısı kurulamadı";
        },
        sendMessage: (state, action) => {
            state.message = action.payload;
        },
        disconnect: (state) => {
            state.connected = false;
            state.message = "Websocket bağlantısı kapatıldı";
        }
    }
});

export const { connect, connectionEstablished, connectionFailed, sendMessage, disconnect } = socketSlice.actions;
export default socketSlice.reducer;