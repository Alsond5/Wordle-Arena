from fastapi import FastAPI, Depends, HTTPException, WebSocket
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel
from datetime import datetime
from enum import Enum

from database import database
from typing import Annotated
from dataclasses import dataclass, field

import uuid
import asyncio
import random

import time
import json

app = FastAPI()

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()

class LoginRequest(BaseModel):
    username: str
    password: str

class User(BaseModel):
    uid: str
    username: str

def login_required(credentials: Annotated[HTTPAuthorizationCredentials , Depends(security)]):
    result = database.verify_token(credentials.credentials)

    if result is None:
        raise HTTPException(status_code=401, detail="Not authenticated")

    print(result)

    return User(**result)

@app.post("/api/login")
async def login(login_request: LoginRequest):
    result = database.login(login_request.username, login_request.password)

    return result.to_dict()

@app.post("/api/register")
async def register(login_request: LoginRequest):
    result = database.register(login_request.username, login_request.password)

    return result.to_dict()

@app.get("/api/@me")
async def get_user_details(credentials: Annotated[User, Depends(login_required)]):
    result = database.get_user(credentials.uid)

    return result.to_dict()

# websockets

class Status(Enum):
    WAITING_TOKEN = 0
    ONLINE = 1
    PLAYING = 2
    WAITING_RECONNECT = 3

class UserDetails(BaseModel):
    uid: str
    username: str
    status: Status

@dataclass
class Connection:
    socket: WebSocket
    user: UserDetails | None = None
    token: str | None = None
    channel: str | None = None
    room: int | None = None
    game_id: str | None = None

@dataclass
class Player:
    websocket_id: str
    word: str | None = None
    letter_informations: dict | None = None
    letters_known_correctly: list[str] = field(default_factory=list)
    letters_known_incorrectly: list[str] = field(default_factory=list)
    score: int = 0
    predictions_count: int = 0
    confirm_time: float = 0.0

@dataclass
class Game:
    players: list[Player]
    channel: str
    room: int
    timestamp: float
    status: str = "created"

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: dict[str, Connection] = {}
        self.games: dict[str, Game] = {}
        self.channels: dict[str, dict[int, list[str]]] = {
            "harfli": {
                4: [],
                5: [],
                6: [],
                7: []
            },
            "harfsiz": {
                4: [],
                5: [],
                6: [],
                7: []
            }
        }
        self.scores: dict[str, int] = {}
        self.heartbeat_interval = 15.0
        self.valid_words = self.get_valid_words()

    def get_valid_words(self):
        with open("words.json", "r", encoding="utf-8") as file:
            words = json.load(file)

            return words

    async def check_token(self, wid: str):
        connection = self.active_connections[wid]

        try:
            payload = await asyncio.wait_for(connection.socket.receive_json(), timeout=10.0)
        except asyncio.TimeoutError:
            await self.invalid_session(wid)
            return
        else:
            if "op" not in payload or "d" not in payload:
                await self.invalid_session(wid)
                return
            
            if payload["op"] != 2:
                await self.invalid_session(wid)
                return
            
            data = payload["d"]

            if "token" not in data:
                await self.invalid_session(wid)
                return
            
            token = data["token"]

            user = database.verify_token(token)

            if user is None:
                await self.invalid_session(wid)
                return
            
            connection.token = token
            connection.user = UserDetails(uid=wid, username=user["username"], status=Status.ONLINE)

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        
        wid = uuid.uuid4().hex
        connection = Connection(socket=websocket)

        self.active_connections[wid] = connection
        await websocket.send_json({
            "op": 10,
            "d": {
                "wid": wid
            }
        })

        await self.check_token(wid)

        return wid
    
    # Have you joined a chamber before?
    async def check_room(self, wid: str, connection: Connection):
        if connection.channel is None or connection.room is None:
            return
        
        self.channels[connection.channel][connection.room].remove(wid)
        
        for w in self.channels[connection.channel][connection.room]:
            con = self.active_connections[w]

            await con.socket.send_json({
                "op": 0,
                "d": {
                    "user": {
                        "uid": connection.user.uid,
                        "username": connection.user.username,
                        "status": connection.user.status.value
                    }
                },
                "t": "USER_LEAVE_ROOM"
            })

    async def finish_game(self, connection: Connection, other_connection: Connection):
        game_id = connection.game_id
        game = self.games[game_id]

        connection.game_id = None
        connection.user.status = Status.ONLINE

        other_connection.game_id = None
        other_connection.user.status = Status.ONLINE

        for c in self.channels[connection.channel][connection.room]:
            socket = self.active_connections[c].socket

            await socket.send_json({
                "op": 0,
                "d": {
                    "users": [{
                        "uid": p.websocket_id,
                        "status": Status.ONLINE.value
                    } for p in game.players]
                },
                "t": "STATUS_UPDATE"
            })

        del self.games[game_id]
    
    def get_letters_status(self, player_word: str, player: Player, other_player: Player):
        letters = []

        for index, letter in enumerate(player_word):
            if letter == other_player.word[index]:
                letters.append({
                    "value": letter,
                    "status": "correct"
                })
                
                player.letters_known_correctly.append(letter)

            elif letter in other_player.word:
                count = other_player.word.count(letter)

                previous_letters = [l["value"] for l in letters]

                if previous_letters.count(letter) < count:
                    letters.append({
                        "value": letter,
                        "status": "present"
                    })

                    player.letters_known_incorrectly.append(letter)
                else:
                    letters.append({
                        "value": letter,
                        "status": "absent"
                    })
            else:
                letters.append({
                    "value": letter,
                    "status": "absent"
                })

        return letters

    # opcode 3
    async def join_room(self, wid: str, data: dict):
        connection = self.active_connections[wid]

        if connection.user.status != Status.ONLINE:
            return
        
        if "channel" not in data or "room" not in data:
            return
        
        channel = data["channel"]
        room = data["room"]

        if connection.channel == channel and connection.room == room:
            return

        if channel not in ["harfli", "harfsiz"]:
            return
        
        if room not in [4, 5, 6, 7]:
            return
        
        await self.check_room(wid, connection)
        
        connection.channel = channel
        connection.room = room

        users = []

        for w in self.channels[channel][room]:
            con = self.active_connections[w]
            socket = con.socket

            if con.user is None:
                continue

            users.append({
                "uid": con.user.uid,
                "username": con.user.username,
                "status": con.user.status.value
            })

            await socket.send_json({
                "op": 0,
                "d": {
                    "user": {
                        "uid": connection.user.uid,
                        "username": connection.user.username,
                        "status": connection.user.status.value
                    }
                },
                "t": "USER_JOIN_ROOM"
            })

        await connection.socket.send_json({
            "op": 0,
            "d": {
                "users": users
            },
            "t": "JOIN_ROOM"
        })

        self.channels[channel][room].append(wid)

    # opcode 4
    async def send_game_request(self, wid: str, data: dict):
        connection = self.active_connections[wid]

        if connection.user.status != Status.ONLINE:
            return
        
        if "uid" not in data:
            return
        
        uid = data["uid"]
        other_connection = self.active_connections[uid]

        game_id = uuid.uuid4().hex

        self.games[game_id] = Game(
            players=[
                Player(websocket_id=wid),
                Player(websocket_id=uid)
            ],
            channel=connection.channel,
            room=connection.room,
            timestamp=datetime.now().timestamp()
        )
        
        await other_connection.socket.send_json({
            "op": 0,
            "d": {
                "from": {
                    "uid": connection.user.uid,
                    "username": connection.user.username,
                    "status": connection.user.status.value
                },
                "game_id": game_id
            },
            "t": "GAME_REQUEST"
        })

    # opcode 5
    async def accept_request(self, wid: str, data: dict):
        connection = self.active_connections[wid]

        if connection.user.status != Status.ONLINE:
            return
        
        if "game_id" not in data:
            return
        
        game_id = data["game_id"]
        game = self.games[game_id]

        if game is None:
            return
        
        if game.status != "created":
            return
        
        game.status = "accepted"

        for player in game.players:
            player_connection = self.active_connections[player.websocket_id]
            player_connection.user.status = Status.PLAYING
            player_connection.game_id = game_id

            d = {
                "game_id": game_id,
                "opponent": {
                    "uid": self.active_connections[game.players[1 - game.players.index(player)].websocket_id].user.uid,
                    "username": self.active_connections[game.players[1 - game.players.index(player)].websocket_id].user.username
                }
            }

            if game.channel == "harfli":
                alfabets = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ"
                l = random.choice(alfabets)
                i = random.randint(0, game.room - 1)

                player.letter_informations = {
                    "letter": l,
                    "index": i
                }

                d["letter"] = l
                d["index"] = i

            await player_connection.socket.send_json({
                "op": 0,
                "d": d,
                "t": "GAME_ACCEPTED"
            })

        for w in self.channels[game.channel][game.room]:
            con = self.active_connections[w]

            await con.socket.send_json({
                "op": 0,
                "d": {
                    "users": [{
                        "uid": p.websocket_id,
                        "status": con.user.status.value
                    } for p in game.players]
                },
                "t": "STATUS_UPDATE"
            })

    # opcode 6
    async def decline_request(self, wid: str, data: dict):
        connection = self.active_connections[wid]

        if connection.user.status != Status.ONLINE:
            return
        
        if "game_id" not in data:
            return
        
        game_id = data["game_id"]
        game = self.games[game_id]

        if game is None:
            return
        
        if game.status != "created":
            return
        
        del self.games[game_id]

        for player in game.players:
            socket = self.active_connections[player.websocket_id].socket

            await socket.send_json({
                "op": 0,
                "d": {
                    "game_id": game_id
                },
                "t": "GAME_REJECTED"
            })

    # opcode 7
    async def confirm_word(self, wid: str, data: dict):
        connection = self.active_connections[wid]

        if connection.user.status != Status.PLAYING:
            return
        
        if "game_id" not in data or "word" not in data:
            return
        
        game_id = data["game_id"]
        word = data["word"]
        game = self.games[game_id]

        if game is None:
            return
        
        if game.status != "accepted":
            return
        
        if datetime.now().timestamp() - game.timestamp > 60:
            return
        
        player = None

        for p in game.players:
            if p.websocket_id == wid:
                player = p
                break
        
        if player is None:
            return
        
        if player.letter_informations is not None and word[player.letter_informations["index"]] != player.letter_informations["letter"]:
            return
        
        if len(word) != game.room or player.word is not None or self.valid_words[word[0]][str(len(word))] is None:
            return
        
        player.word = word
        player.confirm_time = 60.0 - (datetime.now().timestamp() - game.timestamp)

        print(player.word)
        print(player.confirm_time)

        other_player = game.players[1 - game.players.index(player)]

        if other_player.word is None:
            await connection.socket.send_json({
                "op": 0,
                "d": {
                    "game_id": game_id
                },
                "t": "CONFIRMED_WORD"
            })

            return
        
        game.status = "playing"
        
        for p in game.players:
            con = self.active_connections[p.websocket_id]

            await con.socket.send_json({
                "op": 0,
                "d": {
                    "game_id": game_id
                },
                "t": "START_GAME"
            })

    async def check_word(self, wid: str, data: dict):
        connection = self.active_connections[wid]
        game = self.games[connection.game_id]

        if "word" not in data:
            return
        
        player_word = data["word"]
        print("player word:", player_word)

        player = None

        for p in game.players:
            if p.websocket_id == wid:
                player = p
                break

        if player is None:
            return
        
        if player.predictions_count == game.room:
            return
        
        other_player = game.players[1 - game.players.index(player)]

        if other_player is None or other_player.word is None:
            return
        
        letters = []

        if player_word not in self.valid_words[player_word[0]][str(len(player_word))]:
            await connection.socket.send_json({
                "op": 0,
                "d": {
                    "letters": [],
                    "valid": False,
                    "row": None
                },
                "t": "CHECK_WORD"
            })

            return
        
        player.letters_known_correctly = []
        player.letters_known_incorrectly = []

        letters = self.get_letters_status(player_word, player, other_player)

        await connection.socket.send_json({
            "op": 0,
            "d": {
                "letters": letters,
                "valid": True,
                "row": None
            },
            "t": "CHECK_WORD"
        })

        other_connection = self.active_connections[other_player.websocket_id]

        await other_connection.socket.send_json({
            "op": 0,
            "d": {
                "letters": letters,
                "valid": True,
                "row": player.predictions_count
            },
            "t": "CHECK_WORD"
        })

        player.predictions_count += 1

        if player_word == other_player.word:
            await connection.socket.send_json({
                "op": 0,
                "d": {
                    "player_word": player.word,
                    "other_player_word": other_player.word,
                    "player_score": 100,
                    "other_player_score": 0,
                    "winner": connection.user.username
                },
                "t": "WON_GAME"
            })

            await other_connection.socket.send_json({
                "op": 0,
                "d": {
                    "player_word": other_player.word,
                    "other_player_word": player.word,
                    "player_score": 0,
                    "other_player_score": 100,
                    "winner": connection.user.username
                },
                "t": "LOSE_GAME"
            })

            await self.finish_game(connection, other_connection)
            
            return

        if player.predictions_count == game.room:
            if other_player.predictions_count == game.room:
                player.score = len(player.letters_known_correctly) * 10 + len(player.letters_known_incorrectly) * 5 + int(player.confirm_time)
                other_player.score = len(other_player.letters_known_correctly) * 10 + len(other_player.letters_known_incorrectly) * 5 + int(other_player.confirm_time)

                for p in game.players:
                    con = self.active_connections[p.websocket_id]

                    print(p.score, ": ", p.letters_known_correctly, p.letters_known_incorrectly, p.confirm_time)

                    await con.socket.send_json({
                        "op": 0,
                        "d": {
                            "player_word": p.word,
                            "other_player_word": game.players[1 - game.players.index(p)].word,
                            "player_score": p.score,
                            "other_player_score": game.players[1 - game.players.index(p)].score,
                            "winner": con.user.username if p.score > game.players[1 - game.players.index(p)].score else self.active_connections[game.players[1 - game.players.index(p)].websocket_id].user.username
                        },
                        "t": "WON_GAME" if p.score > game.players[1 - game.players.index(p)].score else "LOSE_GAME"
                    })

                await self.finish_game(connection, other_connection)
            else:
                await other_connection.socket.send_json({
                    "op": 0,
                    "d": {},
                    "t": "OTHER_PLAYER_FINISHED"
                })

                async def send_random_word():
                    alfabets = "ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ"

                    start = time.time()
                    predictions = other_player.predictions_count

                    while True:
                        if other_player.predictions_count != predictions:
                            start = time.time()
                            predictions = other_player.predictions_count

                        if other_player.predictions_count == game.room:
                            break

                        if time.time() - start >= 10:
                            word = random.choice(self.valid_words[random.choice(alfabets)][str(len(player.word))])
                            
                            await self.check_word(other_player.websocket_id, {"word": word})
                            
                            start = time.time()
                            predictions = other_player.predictions_count

                        await asyncio.sleep(1)

                asyncio.ensure_future(send_random_word())

    async def check_word_exists(self, wid: str):
        connection = self.active_connections[wid]

        if connection.user.status != Status.PLAYING:
            return
        
        game_id = connection.game_id
        game = self.games[game_id]

        if game is None:
            return
        
        if game.status != "accepted":
            return
        
        player = None

        for p in game.players:
            if p.websocket_id != wid:
                player = p
                break
        
        if player is None:
            return
        
        if player.word is None:
            game.timestamp = datetime.now().timestamp()

            await connection.socket.send_json({
                "op": 0,
                "d": {},
                "t": "TRY_AGAIN"
            })

            return
        
        other_connection = self.active_connections[player.websocket_id]
        
        await connection.socket.send_json({
            "op": 0,
            "d": {
                "player_word": "",
                "other_player_word": player.word,
                "player_score": 0,
                "other_player_score": 100,
                "winner": other_connection.user.username
            },
            "t": "LOSE_GAME"
        })

        await other_connection.socket.send_json({
            "op": 0,
            "d": {
                "player_word": player.word,
                "other_player_word": "",
                "player_score": 100,
                "other_player_score": 0,
                "winner": other_connection.user.username
            },
            "t": "WON_GAME"
        })

        await self.finish_game(connection, other_connection)

    async def time_is_up(self, wid: str):
        connection = self.active_connections[wid]

        game_id = connection.game_id

        if game_id is None:
            return

        game = self.games[game_id]

        if game is None:
            return

        player: Player
        other_player: Player

        for p in game.players:
            if p.websocket_id == wid:
                player = p
            else:
                other_player = p

        if player is None or other_player is None:
            return
        
        if player.predictions_count == game.room:
            return
        
        other_connection = self.active_connections[other_player.websocket_id]

        await connection.socket.send_json({
            "op": 0,
            "d": {
                "player_word": player.word,
                "other_player_word": other_player.word,
                "player_score": 0,
                "other_player_score": 100,
                "winner": other_connection.user.username
            },
            "t": "LOSE_GAME"
        })

        await other_connection.socket.send_json({
            "op": 0,
            "d": {
                "player_word": other_player.word,
                "other_player_word": player.word,
                "player_score": 100,
                "other_player_score": 0,
                "winner": other_connection.user.username
            },
            "t": "WON_GAME"
        })

        await self.finish_game(connection, other_connection)
            
    async def quit_game(self, wid: str):
        connection = self.active_connections[wid]

        game_id = connection.game_id

        if game_id is None:
            return

        game = self.games[game_id]

        if game is None:
            return

        player: Player
        other_player: Player

        for p in game.players:
            if p.websocket_id == wid:
                player = p
            else:
                other_player = p

        if player is None or other_player is None:
            return
        
        if other_player.websocket_id in self.scores.keys():
            self.scores[other_player.websocket_id] += 100
        else:
            self.scores[other_player.websocket_id] = 100

        other_connection = self.active_connections[other_player.websocket_id]
        
        try:
            await connection.socket.send_json({
                "op": 0,
                "d": {
                    "player_word": player.word,
                    "other_player_word": other_player.word,
                    "player_score": 0,
                    "other_player_score": 100,
                    "winner": other_connection.user.username
                },
                "t": "LOSE_GAME"
            })
        except:
            print("Failed to send message")
        
        try:
            await other_connection.socket.send_json({
                "op": 0,
                "d": {
                    "player_word": other_player.word,
                    "other_player_word": player.word,
                    "player_score": 100,
                    "other_player_score": 0,
                    "winner": other_connection.user.username
                },
                "t": "WON_GAME"
            })
        except:
            print("Failed to send message")
        
        await self.finish_game(connection, other_connection)
    
    async def message(self, wid: str, payload: dict):
        if "op" not in payload or "d" not in payload:
            return
        
        connection = self.active_connections[wid]
        
        if payload["op"] == 3:
            await self.join_room(wid, payload["d"])
            print(f"[LOG] {connection.user.username} JOINED ROOM! CHANNEL: {connection.channel}, ROOM: {connection.room}")
        elif payload["op"] == 4:
            await self.send_game_request(wid, payload["d"])
            print(f"[LOG] {connection.user.username} SENT GAME REQUEST TO {self.active_connections[payload['d']['uid']].user.username}!")
        elif payload["op"] == 5:
            await self.accept_request(wid, payload["d"])
            print(f"[LOG] {connection.user.username} ACCEPTED GAME REQUEST!")
        elif payload["op"] == 6:
            await self.decline_request(wid, payload["d"])
            print(f"[LOG] {connection.user.username} DECLINED GAME REQUEST!")
        elif payload["op"] == 7:
            await self.confirm_word(wid, payload["d"])
            print(f"[LOG] {connection.user.username} CONFIRMED WORD!")
        elif payload["op"] == 10:
            await self.check_word(wid, payload["d"])
            print(f"[LOG] {connection.user.username} CHECKED WORD!")
        elif payload["op"] == 11:
            await self.check_word_exists(wid)
            print(f"[LOG] {connection.user.username} CHECKED WORD EXISTS!")
        elif payload["op"] == 12:
            await self.time_is_up(wid)
            print(f"[LOG] {connection.user.username} TIME IS UP!")

    async def disconnect(self, wid: str):
        connection = self.active_connections[wid]

        if connection.user.status == Status.PLAYING:
            await self.quit_game(wid)

        del self.active_connections[wid]
        await self.check_room(wid, connection)

    async def invalid_session(self, wid: str):
        connection = self.active_connections[wid]

        await connection.socket.send_json({"op": 8, "d": False})
        await connection.socket.close()

manager = ConnectionManager()

@app.websocket("/gateway")
async def connect_websocket(websocket: WebSocket):
    websocket_id = await manager.connect(websocket)

    last_heartbeat_sent = time.time()
    heartbeat_interval = 10.0

    async def handle_heartbeats():
        while True:
            if time.time() - last_heartbeat_sent >= heartbeat_interval:
                try:
                    await manager.quit_game(websocket_id)
                    await websocket.close()
                    break
                except:
                    break

            await asyncio.sleep(1)
    
    asyncio.ensure_future(handle_heartbeats())

    try:
        while True:
            data = await websocket.receive_json()

            if data["op"] == 1:
                last_heartbeat_sent = time.time()

                await websocket.send_json({"op": 11})
            else:
                await manager.message(websocket_id, data)

    except Exception as e:
        print("Error:", e)
        try:
            await manager.disconnect(websocket_id)
        except:
            print("Error while send disconnect message")