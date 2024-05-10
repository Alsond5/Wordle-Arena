import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    row: 0,
    col: 0,
    gameId: null,
    gameStatus: null,
    requestDetails: null,
    waiting: false,
    initialLetter: null,
    opponent: null,
    wordCheckResults: null,
    words: [],
    opponentsWords: [],
    error: null,
    timestamp: null,
    results: null
}

export const gameSlice = createSlice({
    name: "game",
    initialState,
    reducers: {
        setRow: (state, action) => {
            state.row = action.payload;
        },
        setCol: (state, action) => {
            state.col = action.payload;
        },
        setGameId: (state, action) => {
            state.gameId = action.payload;
        },
        setGameStatus: (state, action) => {
            state.gameStatus = action.payload;
        },
        setRequestDetails: (state, action) => {
            state.requestDetails = action.payload;
        },
        setWaiting: (state, action) => {
            state.waiting = action.payload;
        },
        setInitialLetter: (state, action) => {
            state.initialLetter = action.payload;
        },
        setOpponent: (state, action) => {
            state.opponent = action.payload;
        },
        setWordCheckResults: (state, action) => {
            state.wordCheckResults = action.payload;
        },
        setWords: (state, action) => {
            state.words = action.payload;
        },
        updateWords: (state, action) => {
            const row = action.payload.row;
            const col = action.payload.col;
            const value = action.payload.value;

            state.words[row][col] = value;
        },
        updateRowWords: (state, action) => {
            const row = action.payload.row;
            const value = action.payload.value;

            state.words[row] = value;
        },
        setOpponentsWords: (state, action) => {
            state.opponentsWords = action.payload;
        },
        updateOpponentsWords: (state, action) => {
            const row = action.payload.row;
            const col = action.payload.col;
            const value = action.payload.value;

            state.opponentsWords[row][col] = value;
        },
        updateRowOpponentsWords: (state, action) => {
            const row = action.payload.row;
            const value = action.payload.value;

            state.opponentsWords[row] = value;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setTimestamp: (state, action) => {
            state.timestamp = action.payload;
        },
        setResults: (state, action) => {
            state.results = action.payload;
        }
    }
});

export const { setRow, setCol, setGameId, setGameStatus, setRequestDetails, setWaiting, setInitialLetter, setOpponent, setWordCheckResults, setWords, updateWords, updateRowWords, setOpponentsWords, updateOpponentsWords,updateRowOpponentsWords, setError, setTimestamp, setResults } = gameSlice.actions;
export default gameSlice.reducer;