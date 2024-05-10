import { connect, sendMessage, connectionEstablished, connectionFailed, disconnect } from "./socket-slice";
import { setUsers, addUser, removeUser, updateStatus } from "./channel-slice";
import { addWord, setGameId, setGameStatus, setInitialLetter, setRequestDetails, setWaiting, setWordCheckResults, setError, setWords, setResults, setOpponentsWords, updateRowOpponentsWords, setOpponent } from "./game-slice";

const server_address = "192.168.63.140:8000";

const heartbeatInterval = 7000;
let socket = null;
let intervalId = null;

const join_room = (store, data) => {
    store.dispatch(setUsers(data.users));
}

const user_join_room = (store, data) => {
    store.dispatch(addUser(data.user));
}

const user_leave_room = (store, data) => {
    store.dispatch(removeUser(data.user));
}

const game_request = (store, data) => {
    store.dispatch(setRequestDetails(data));
    store.dispatch(setGameStatus("request"));
}

const game_accept = (store, data) => {
    store.dispatch(setGameId(data.game_id));
    store.dispatch(setGameStatus("accept"));

    if (data.letter) {
        store.dispatch(setInitialLetter(data));
    }

    store.dispatch(setWaiting(false));
    store.dispatch(setRequestDetails(null));
    store.dispatch(setWords(new Array(store.getState().channel.room).fill(new Array(store.getState().channel.room).fill(""))));
    store.dispatch(setOpponentsWords(new Array(store.getState().channel.room).fill(new Array(store.getState().channel.room).fill(""))));
    store.dispatch(setOpponent(data.opponent));
}

const game_reject = (store, data) => {
    store.dispatch(setGameStatus("reject"));
    store.dispatch(setWaiting(false));
    store.dispatch(setRequestDetails(null));
}

const status_update = (store, data) => {
    store.dispatch(updateStatus(data.users));
}

const confirm_word = (store, data) => {
    console.log(data);
    store.dispatch(setGameStatus("confirm"));
}

const start_game = (store, data) => {
    store.dispatch(setGameStatus("start"));
    store.dispatch(setWaiting(false));
}

const check_word = (store, data) => {
    if (!data.valid) {
        store.dispatch(setError(true));

        return;
    }

    console.log(data.row);

    if (data.row !== null) {
        store.dispatch(updateRowOpponentsWords({value: data.letters, row: data.row }));
    } else {
        store.dispatch(setWordCheckResults(data.letters));
    }
}

const try_again = (store, data) => {
    store.dispatch(setGameStatus("try_again"));
}

const random_word = (store, data) => {
    store.dispatch(setWordCheckResults(data.letters))
}

const other_player_finished = (store, data) => {
    store.dispatch(setGameStatus("other_player_finished"));
}

const lose_game = (store, data) => {
    store.dispatch(setResults(data));
    store.dispatch(setGameStatus("lose"));
}

const won_game = (store, data) => {
    store.dispatch(setResults(data));
    store.dispatch(setGameStatus("win"));
}

const events = {
    JOIN_ROOM: join_room,
    USER_JOIN_ROOM: user_join_room,
    USER_LEAVE_ROOM: user_leave_room,
    GAME_REQUEST: game_request,
    GAME_ACCEPTED: game_accept,
    GAME_REJECTED: game_reject,
    STATUS_UPDATE: status_update,
    CONFIRMED_WORD: confirm_word,
    START_GAME: start_game,
    CHECK_WORD: check_word,
    TRY_AGAIN: try_again,
    RANDOM_WORD: random_word,
    OTHER_PLAYER_FINISHED: other_player_finished,
    LOSE_GAME: lose_game,
    WON_GAME: won_game
}

const socketMiddleware = (store) => (next) => (action) => {
    if (connect.match(action)) {
        if (socket !== null || typeof window === "undefined") {
            console.log("girdi3");
            return;
        }

        socket = new WebSocket(`ws://${server_address}/gateway`);

        socket.onopen = () => {
            store.dispatch(connectionEstablished());

            intervalId = setInterval(() => {
                if (socket === null) return;
                
                socket.send(JSON.stringify({ op: 1 }));
            }, heartbeatInterval);
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.op === 10) {
                store.dispatch(sendMessage({
                    op: 2,
                    d: {
                        token: action.payload.token
                    }
                }));
            }

            else if (data.op === 0) {
                const event = data.t;
                const callback = events[event];

                if (callback) callback(store, data.d);
            }
        };

        socket.onclose = () => {
            console.log("Connection closed");
            store.dispatch(connectionFailed());
            socket = null;

            clearInterval(intervalId);
        };

        socket.onerror = (error) => {
            console.log(error);
            store.dispatch(connectionFailed());
            socket = null;
            
            clearInterval(intervalId);
        }
    }

    else if (socket && sendMessage.match(action)) {
        socket.send(JSON.stringify(action.payload));
    }

    else if (socket && disconnect.match(action)) {
        socket.close();
        socket = null;
    }

    next(action);
};

export default socketMiddleware;