from fastapi import FastAPI 
from starlette.middleware.cors import CORSMiddleware

from pymongo import MongoClient
from dotenv import load_dotenv
import os
from pydantic import BaseModel,EmailStr
load_dotenv()

app = FastAPI()
client = MongoClient(os.getenv("MONGO_URI"))
db = client["restaurant"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
userCollection = db["users"]
@app.get("/")
def default():
    return {
        "data" : "Hello World"
        
    }
class User(BaseModel):
    name : str
    mail : EmailStr
    password : str
@app.post("/register")
def register():
    return 0


