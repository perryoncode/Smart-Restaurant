from fastapi import FastAPI 
from starlette.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
import os
from pydantic import BaseModel,EmailStr
load_dotenv()




app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



client = MongoClient("mongodb+srv://codewithperry:uYIoXdcbIBi3qdBh@cluster0.iub7ykj.mongodb.net/")
db = client["Restaurant"]
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

class LoginUser(BaseModel):
    mail: EmailStr
    password: str

@app.post("/register")
def register(user:User):
    userInDb = userCollection.find_one({"mail": user.mail}) #🔎 hai ye??
    if (userInDb):
        return {"response" : "alreadyExists"} # 😡 alt kyu bnara hai
    else:
        userCollection.insert_one({
        "name" : user.name,
        "mail" : user.mail,
        "password" : user.password
        })
        return {
            "response" : "success"
        }




@app.post("/login")
def login(user: LoginUser):
    userInDb = userCollection.find_one({"mail": user.mail}) #🔎 kha hai ye
    if not userInDb: #agar na mile 🔴
        return {"response": "notExist"}
    if userInDb["password"] == user.password: #agr mil jaye 🟢
        userInDb["_id"] = str( userInDb["_id"])
        userInDb.pop("password",None)
        return {"response": "success" , "user": userInDb}
    else: #use password manager 👍🏻
        return {"response": "wrongPassword"}
    



@app.get("/table/{tableID}")
def tableResolver(tableID):
    return {
        "data" : tableID
        
    }