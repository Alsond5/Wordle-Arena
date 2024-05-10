from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId

from dotenv import load_dotenv
import os

import hashlib
import secrets
import jwt

from dataclasses import dataclass

secret_key = secrets.token_hex(32)
algorithm = "HS256"

load_dotenv()

username = os.getenv("USERNAME")
password = os.getenv("PASSWORD")

uri = f"mongodb+srv://admin:{password}@cluster0.uvxg9zd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(uri, server_api=ServerApi('1'))

db = client.get_database("WordleDB")

@dataclass
class Result:
    error: bool
    payload: str
    user: dict

    def to_dict(self):
        return {
            "error": self.error,
            "payload": self.payload,
            "user": self.user
        }

def register(username: str, password: str) -> Result:
    if username is None or password is None or username == "" or password == "":
        result = Result(
            error=True,
            payload="Geçersiz kullanıcı adı veya şifre",
            user=None
        )
        
        return result
    
    users = db.get_collection("Users")

    user = users.find_one({ "username": username })

    if user:
        result = Result(
            error=True,
            payload="Kullanıcı adı zaten alınmış. Lütfen başka bir kullanıcı adı deneyin.",
            user=None
        )

        return result
    
    password_hash = hashlib.sha3_256(password.encode()).hexdigest()
    
    user = users.insert_one({
        "username": username,
        "password": password_hash
    })

    token = jwt.encode(
        payload={
            "uid": str(user.inserted_id),
            "username": username
        },
        key=secret_key,
        algorithm=algorithm
    )

    result = Result(
        error=False,
        payload=token,
        user={
            "_id": str(user.inserted_id),
            "username": username
        }
    )

    return result

def login(username: str, password: str) -> Result:
    if username is None or password is None or username == "" or password == "":
        result = Result(
            error=True,
            payload="Geçersiz kullanıcı adı veya şifre",
            user=None
        )
        
        return result
    
    users = db.get_collection("Users")
    
    password_hash = hashlib.sha3_256(password.encode()).hexdigest()
        
    user = users.find_one(
        { "username": username, "password": password_hash },
        {
            "_id": { "$toString": "$_id" },
            "username": 1
        }
    )

    if user is None:
        result = Result(
            error=True,
            payload="Kullanıcı adı veya şifre hatalı. Lütfen tekrar deneyin.",
            user=None
        )

        return result
    
    token = jwt.encode(
        payload={
            "uid": user["_id"],
            "username": user["username"]
        },
        key=secret_key,
        algorithm=algorithm
    )

    result = Result(
        error=False,
        payload=token,
        user=user
    )

    return result

def get_user(uid: str) -> Result:
    users = db.get_collection("Users")

    user = users.find_one(
        { "_id": ObjectId(uid) },
        {
            "_id": { "$toString": "$_id" },
            "username": 1
        }
    )

    if user is None:
        result = Result(
            error=True,
            payload="Kullanıcı bulunamadı!",
            user=None
        )

        return result
    
    result = Result(
        error=False,
        payload=uid,
        user=user
    )

    return result

def verify_token(token: str) -> dict | None:
    payload = {}

    try:
        payload = jwt.decode(token, secret_key, algorithms=[algorithm])
    except jwt.InvalidTokenError:
        return None
    
    return payload