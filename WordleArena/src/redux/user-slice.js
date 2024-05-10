import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

const server_address = "localhost:8000";

export const login = createAsyncThunk("user/login", async ({ username, password }) => {
    try {
        const response = await fetch(`http://${server_address}/api/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.status !== 200) {
            throw Error("Giriş yapma sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        }

        const result = await response.json();

        if (result.error) {
            throw Error(result.payload);
        }
        
        const token = result.payload;
        const user = result.user;

        return { token, user };
    } catch (error) {
        throw error;
    }
});

export const register = createAsyncThunk("user/register", async ({ username, password }) => {
    try {
        const response = await fetch(`http://${server_address}/api/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        if (response.status !== 200) {
            throw Error("Kayıt olma sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        }

        const result = await response.json();

        if (result.error) {
            throw Error(result.payload);
        }
        
        const token = result.payload;
        const user = result.user;

        return { token, user };
    } catch (error) {
        throw error;
    }
})

const initialState = {
    username: null,
    authenticated: false,
    user: null,
    loading: false,
    error: null
}

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setUsername: (state, action) => {
            state.username = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        logout: (state) => {
            state.username = null;
            state.authenticated = false;
            state.user = null;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(login.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(login.fulfilled, (state, action) => {
            state.loading = false;
            state.authenticated = true;

            const user = {
                username: action.payload.user.username,
                uid: action.payload.user._id,
                token: action.payload.token
            }

            state.user = user;
        });
        builder.addCase(login.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        });
        builder.addCase(register.pending, (state) => {
            state.loading = true;
        });
        builder.addCase(register.fulfilled, (state, action) => {
            state.loading = false;
            state.authenticated = true;

            const user = {
                username: action.payload.user.username,
                uid: action.payload.user._id,
                token: action.payload.token
            }

            state.user = user;
        });
        builder.addCase(register.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message;
        });
    }
});

export const { setUsername, setError, logout } = userSlice.actions;
export default userSlice.reducer;