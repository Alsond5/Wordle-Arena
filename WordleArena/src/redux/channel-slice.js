import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    channel: null,
    room: null,
    users: []
}

export const channelSlice = createSlice({
    name: "channel",
    initialState,
    reducers: {
        setChannel: (state, action) => {
            state.channel = action.payload;
        },
        setRoom: (state, action) => {
            state.room = action.payload;
        },
        setUsers: (state, action) => {
            state.users = action.payload;
        },
        addUser: (state, action) => {
            state.users.push(action.payload);
        },
        removeUser: (state, action) => {
            state.users = state.users.filter(user => user.uid !== action.payload.uid);
        },
        updateStatus: (state, action) => {
            action.payload.forEach((newUser) => {
                state.users = state.users.map(user => {
                    if (user.uid === newUser.uid) {
                        return {
                            ...user,
                            status: newUser.status
                        }
                    }
    
                    return user;
                });
            });
        }
    }
});

export const { setChannel, setRoom, setUsers, addUser, removeUser, updateStatus } = channelSlice.actions;
export default channelSlice.reducer;