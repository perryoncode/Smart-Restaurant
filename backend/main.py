from fastapi import Query
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
dishesCollection = db["dishes"]

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
dishesCollection = db["dishes"]


@app.get("/")
def default():
    return {
        "data" : "Hello World"
        
    }




class User(BaseModel):
    name : str
    mail : EmailStr
    password : str

class UpdateProfile(BaseModel):
    mail: EmailStr
    icon: str = None  # base64 or URL or filename
    address: str = None

@app.put("/update_profile")
def update_profile(update: UpdateProfile):
    update_fields = {}
    if update.icon is not None:
        update_fields["icon"] = update.icon
    if update.address is not None:
        update_fields["address"] = update.address
    if not update_fields:
        return {"response": "no_update_fields"}
    result = userCollection.update_one({"mail": update.mail}, {"$set": update_fields})
    if result.matched_count == 0:
        return {"response": "user_not_found"}
    return {"response": "success"}

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
    



@app.get("/dishes")
def dishes():
    dishes = []
    cursor = dishesCollection.find({})   # fetch all dishes

    for d in cursor:
        d["_id"] = str(d["_id"])         # convert ObjectId to string
        dishes.append(d)

    return {
        "response": "success",
        "dishes": dishes}


# --- PROFILE FETCH ENDPOINT ---
@app.get("/profile")
def get_profile(id: str = Query(None), mail: str = Query(None)):
    # Allow lookup by id or mail
    query = {}
    if id:
        from bson import ObjectId
        try:
            query["_id"] = ObjectId(id)
        except Exception:
            return {"response": "invalid_id"}
    elif mail:
        query["mail"] = mail
    else:
        return {"response": "missing_param"}
    user = userCollection.find_one(query)
    if not user:
        return {"response": "not_found"}
    user["_id"] = str(user["_id"])
    user.pop("password", None)
    # For compatibility with frontend, provide both 'mail' and 'email'
    user["email"] = user.get("mail", "")
    return {"response": "success", "user": user}