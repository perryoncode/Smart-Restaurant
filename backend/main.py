from fastapi import FastAPI, Query
from starlette.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from dotenv import load_dotenv
import bcrypt
import secrets
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
from datetime import datetime

from fastapi import Request

load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("MONGO_URI is not set. Configure it in environment or .env")
client = MongoClient(MONGO_URI)
db = client["Restaurant"]
userCollection = db["users"]
dishesCollection = db["dishes"]
tablesCollection = db["tables"]
ordersCollection = db["orders"]
adminsCollection = db["admins"]
adminSessionsCollection = db["admin_sessions"]

# Admin credentials (simple): set ADMIN_PASSWORD and ADMIN_TOKEN in env for production
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "adminpass")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "admintoken")

# Ensure default admin account exists
def ensure_default_admin():
    try:
        if not adminsCollection.find_one({"email": "admin@dinedelight.com"}):
            pw_hash = bcrypt.hashpw("123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            adminsCollection.insert_one({
                "email": "admin@dinedelight.com",
                "name": "Administrator",
                "password_hash": pw_hash,
                "created_at": datetime.utcnow(),
            })
    except Exception:
        pass

ensure_default_admin()


# -------------------- Models --------------------
class User(BaseModel):
    name: str
    mail: EmailStr
    password: str


class LoginUser(BaseModel):
    mail: EmailStr
    password: str


class UpdateProfile(BaseModel):
    # Identifier: current email of the user
    mail: EmailStr
    # Optional updates
    name: Optional[str] = None
    new_mail: Optional[EmailStr] = None
    icon: Optional[str] = None
    address: Optional[str] = None


class TableModel(BaseModel):
    table_id: int
    table_type: Optional[str] = None
    seats: int


class TableUpdate(BaseModel):
    table_type: Optional[str] = None
    seats: Optional[int] = None


class AdminUserUpdate(BaseModel):
    name: Optional[str] = None
    mail: Optional[EmailStr] = None
    address: Optional[str] = None
    icon: Optional[str] = None


class OrderItem(BaseModel):
    name: str
    price: float
    quantity: int


class OrderModel(BaseModel):
    user_id: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    items: list[OrderItem]


# -------------------- Root --------------------
@app.get("/")
def default():
    return {"data": "Hello World"}


# -------------------- Auth --------------------
@app.post("/register")
def register(user: User):
    if userCollection.find_one({"mail": user.mail}):
        return {"response": "alreadyExists"}
    userCollection.insert_one({
        "name": user.name,
        "mail": user.mail,
        "password": user.password,
    })
    return {"response": "success"}


class AdminLogin(BaseModel):
    email: EmailStr
    password: str


@app.post("/admin/login")
def admin_login(payload: AdminLogin):
    admin = adminsCollection.find_one({"email": payload.email})
    if not admin:
        return {"response": "not_found"}
    pw_hash = admin.get("password_hash", "")
    try:
        ok = bcrypt.checkpw(payload.password.encode("utf-8"), pw_hash.encode("utf-8"))
    except Exception:
        ok = False
    if not ok:
        return {"response": "invalid_password"}
    token = secrets.token_hex(16)
    adminSessionsCollection.insert_one({
        "admin_id": admin.get("_id"),
        "token": token,
        "created_at": datetime.utcnow(),
    })
    return {"response": "success", "token": token, "email": admin.get("email"), "name": admin.get("name", "")}


def get_admin_by_token(token: str):
    if not token:
        return None
    sess = adminSessionsCollection.find_one({"token": token})
    if not sess:
        return None
    admin = adminsCollection.find_one({"_id": sess.get("admin_id")})
    return admin


@app.get("/admin/me")
def admin_me(request: Request):
    token = request.headers.get("x-admin-token") or request.headers.get("X-Admin-Token")
    admin = get_admin_by_token(token)
    if not admin:
        return {"response": "unauthorized"}
    admin_info = {
        "email": admin.get("email"),
        "name": admin.get("name", ""),
    }
    return {"response": "success", "admin": admin_info}


class AdminChangePassword(BaseModel):
    current_password: str
    new_password: str


@app.put("/admin/change_password")
def admin_change_password(payload: AdminChangePassword, request: Request):
    token = request.headers.get("x-admin-token") or request.headers.get("X-Admin-Token")
    admin = get_admin_by_token(token)
    if not admin:
        return {"response": "unauthorized"}
    pw_hash = admin.get("password_hash", "")
    try:
        ok = bcrypt.checkpw(payload.current_password.encode("utf-8"), pw_hash.encode("utf-8"))
    except Exception:
        ok = False
    if not ok:
        return {"response": "invalid_password"}
    new_hash = bcrypt.hashpw(payload.new_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    adminsCollection.update_one({"_id": admin.get("_id")}, {"$set": {"password_hash": new_hash}})
    return {"response": "success"}


class AdminUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None


@app.put("/admin/update")
def admin_update(payload: AdminUpdate, request: Request):
    token = request.headers.get("x-admin-token") or request.headers.get("X-Admin-Token")
    admin = get_admin_by_token(token)
    if not admin:
        return {"response": "unauthorized"}
    update_fields = {}
    if payload.name is not None:
        update_fields["name"] = payload.name
    if payload.email is not None and payload.email != admin.get("email"):
        # ensure unique email
        if adminsCollection.find_one({"email": payload.email, "_id": {"$ne": admin.get("_id")}}):
            return {"response": "alreadyExists"}
        update_fields["email"] = payload.email
    if not update_fields:
        return {"response": "no_update_fields"}
    adminsCollection.update_one({"_id": admin.get("_id")}, {"$set": update_fields})
    return {"response": "success"}


@app.post("/login")
def login(user: LoginUser):
    userInDb = userCollection.find_one({"mail": user.mail})
    if not userInDb:
        return {"response": "notExist"}
    if userInDb["password"] == user.password:
        userInDb["_id"] = str(userInDb["_id"])
        userInDb.pop("password", None)
        return {"response": "success", "user": userInDb}
    return {"response": "wrongPassword"}


# -------------------- Profile --------------------
@app.put("/update_profile")
def update_profile(update: UpdateProfile):
    update_fields = {}
    if update.name is not None:
        update_fields["name"] = update.name
    if update.icon is not None:
        update_fields["icon"] = update.icon
    if update.address is not None:
        update_fields["address"] = update.address
    # Handle email change
    if update.new_mail is not None and update.new_mail != update.mail:
        # prevent duplicates
        if userCollection.find_one({"mail": update.new_mail}):
            return {"response": "alreadyExists"}
        update_fields["mail"] = update.new_mail
    if not update_fields:
        return {"response": "no_update_fields"}
    result = userCollection.update_one(
        {"mail": update.mail}, {"$set": update_fields}
    )
    if result.matched_count == 0:
        return {"response": "user_not_found"}
    return {"response": "success"}


@app.get("/profile")
def get_profile(id: str = Query(None), mail: str = Query(None)):
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
    user["email"] = user.get("mail", "")
    return {"response": "success", "user": user}


# -------------------- Admin Users --------------------
@app.get("/users")
def get_users():
    # NOTE: Page-level auth should prevent access to this in production.
    users = []
    cursor = userCollection.find({})
    for u in cursor:
        u["_id"] = str(u["_id"])
        u.pop("password", None)
        users.append(u)
    return {"response": "success", "users": users}


@app.put("/users/{user_id}")
def admin_update_user(user_id: str, update: AdminUserUpdate):
    from bson import ObjectId
    try:
        oid = ObjectId(user_id)
    except Exception:
        return {"response": "invalid_id"}
    update_fields = {}
    if update.name is not None:
        update_fields["name"] = update.name
    if update.address is not None:
        update_fields["address"] = update.address
    if update.icon is not None:
        update_fields["icon"] = update.icon
    if update.mail is not None:
        existing = userCollection.find_one({"mail": update.mail, "_id": {"$ne": oid}})
        if existing:
            return {"response": "alreadyExists"}
        update_fields["mail"] = update.mail
    if not update_fields:
        return {"response": "no_update_fields"}
    result = userCollection.update_one({"_id": oid}, {"$set": update_fields})
    if result.matched_count == 0:
        return {"response": "not_found"}
    return {"response": "success"}


@app.delete("/users/{user_id}")
def admin_delete_user(user_id: str):
    from bson import ObjectId
    try:
        oid = ObjectId(user_id)
    except Exception:
        return {"response": "invalid_id"}
    result = userCollection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return {"response": "not_found"}
    return {"response": "success"}


# -------------------- Dishes --------------------
@app.get("/dishes")
def dishes():
    dishes_list = []
    cursor = dishesCollection.find({})
    for d in cursor:
        d["_id"] = str(d["_id"])
        dishes_list.append(d)
    return {"response": "success", "dishes": dishes_list}


# -------------------- Tables --------------------
@app.post("/tables")
def create_table(table: TableModel):
    if tablesCollection.find_one({"table_id": table.table_id}):
        return {"response": "exists"}
    # Derive type if not provided
    table_type = table.table_type
    if table_type is None:
        if table.seats == 2:
            table_type = "couple"
        elif table.seats == 4:
            table_type = "family"
        else:
            table_type = "custom"
    tablesCollection.insert_one({
        "table_id": table.table_id,
        "table_type": table_type,
        "seats": table.seats,
    })
    return {"response": "success"}

@app.get("/tables")
def get_tables():
    tables = list(tablesCollection.find({}))
    for t in tables:
        t["_id"] = str(t["_id"])
    return {"response": "success", "tables": tables}


@app.put("/tables/{table_id}")
def update_table(table_id: int, update: TableUpdate):
    updates = {}
    if update.seats is not None:
        updates["seats"] = update.seats
        # If type not explicitly provided, derive from seats to keep consistency
        if update.table_type is None:
            if update.seats == 2:
                updates["table_type"] = "couple"
            elif update.seats == 4:
                updates["table_type"] = "family"
            else:
                updates["table_type"] = "custom"
    if update.table_type is not None:
        updates["table_type"] = update.table_type
    if not updates:
        return {"response": "no_update_fields"}
    result = tablesCollection.update_one({"table_id": table_id}, {"$set": updates})
    if result.matched_count == 0:
        return {"response": "not_found"}
    return {"response": "success"}


@app.delete("/tables/{table_id}")
def delete_table(table_id: int):
    result = tablesCollection.delete_one({"table_id": table_id})
    if result.deleted_count == 0:
        return {"response": "not_found"}
    return {"response": "success"}


# -------------------- Orders --------------------
@app.post("/orders")
def create_order(order: OrderModel):
    if not order.items:
        return {"response": "invalid_request", "message": "No items"}
    total = sum([item.price * item.quantity for item in order.items])
    payload = {
        "user_id": order.user_id,
        "name": order.name,
        "email": order.email,
        "items": [item.dict() for item in order.items],
        "total": total,
        "created_at": datetime.utcnow(),
    }
    ordersCollection.insert_one(payload)
    return {"response": "success"}


@app.get("/orders")
def list_orders(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    customer_email: Optional[str] = Query(None),
):
    query = {}
    if customer_email:
        query["email"] = customer_email
    cursor = ordersCollection.find(query).sort("created_at", -1).skip(offset).limit(limit)
    orders = []
    for o in cursor:
        o["_id"] = str(o.get("_id"))
        # Compact items summary for convenience
        items = o.get("items", [])
        o["items_count"] = sum([i.get("quantity", 0) for i in items])
        orders.append(o)
    total_count = ordersCollection.count_documents(query)
    return {"response": "success", "orders": orders, "total": total_count}


@app.get("/analytics")
def analytics(month: Optional[str] = Query(None)):
    # Optional month filter in format YYYY-MM
    date_filter = {}
    if month:
        try:
            year_s, mon_s = month.split("-")
            year, mon = int(year_s), int(mon_s)
            # Use naive datetimes to match existing stored UTC-naive timestamps
            start = datetime(year, mon, 1)
            if mon == 12:
                next_start = datetime(year + 1, 1, 1)
            else:
                next_start = datetime(year, mon + 1, 1)
            date_filter = {"created_at": {"$gte": start, "$lt": next_start}}
        except Exception:
            date_filter = {}
    # Total sales
    pipeline_total = [
        {"$match": date_filter} if date_filter else {"$match": {}},
        {"$group": {"_id": None, "totalSales": {"$sum": "$total"}, "orders": {"$sum": 1}}}
    ]
    total_doc = list(ordersCollection.aggregate(pipeline_total))
    total_sales = total_doc[0]["totalSales"] if total_doc else 0
    orders_count = total_doc[0]["orders"] if total_doc else 0

    # Most ordered items by quantity
    pipeline_items = [
        {"$match": date_filter} if date_filter else {"$match": {}},
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name", "quantity": {"$sum": "$items.quantity"}}},
        {"$sort": {"quantity": -1}},
        {"$limit": 10},
    ]
    items = list(ordersCollection.aggregate(pipeline_items))
    top_items = [{"name": d["_id"], "quantity": d["quantity"]} for d in items]

    return {
        "response": "success",
        "total_sales": total_sales,
        "orders": orders_count,
        "top_items": top_items,
    }


@app.get("/analytics/monthly")
def analytics_monthly(months: int = Query(12, ge=1, le=36)):
    pipeline = [
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m", "date": "$created_at"}},
                "total": {"$sum": "$total"},
                "orders": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    docs = list(ordersCollection.aggregate(pipeline))
    # Keep only the last N months
    if len(docs) > months:
        docs = docs[-months:]
    series = [{"month": d.get("_id"), "total": d.get("total", 0), "orders": d.get("orders", 0)} for d in docs]
    return {"response": "success", "series": series}


@app.get("/analytics/daily")
def analytics_daily():
    # Group totals per day (UTC) based on created_at
    pipeline = [
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "total": {"$sum": "$total"},
                "orders": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    docs = list(ordersCollection.aggregate(pipeline))
    series = [{"date": d["_id"], "total": d["total"], "orders": d["orders"]} for d in docs]
    return {"response": "success", "series": series}


@app.get("/analytics/top_customers")
def analytics_top_customers():
    pipeline = [
        {
            "$group": {
                "_id": {"name": "$name", "email": "$email"},
                "spent": {"$sum": "$total"},
                "orders": {"$sum": 1},
            }
        },
        {"$sort": {"spent": -1}},
        {"$limit": 10},
    ]
    docs = list(ordersCollection.aggregate(pipeline))
    customers = [{
        "name": (d["_id"] or {}).get("name") or "",
        "email": (d["_id"] or {}).get("email") or "",
        "spent": d.get("spent", 0),
        "orders": d.get("orders", 0),
    } for d in docs]
    return {"response": "success", "customers": customers}


@app.get("/analytics/categories")
def analytics_categories():
    # Build name->category map from dishes collection if available
    name_to_cat = {}
    try:
        for d in dishesCollection.find({}, {"name": 1, "category": 1}):
            name = d.get("name")
            cat = d.get("category") or "Uncategorized"
            if name:
                name_to_cat[name] = cat
    except Exception:
        pass

    # Aggregate items ordered and map to categories
    pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.name", "quantity": {"$sum": "$items.quantity"}}},
    ]
    item_docs = list(ordersCollection.aggregate(pipeline))
    cat_totals = {}
    for doc in item_docs:
        item_name = doc.get("_id")
        qty = doc.get("quantity", 0)
        cat = name_to_cat.get(item_name, "Uncategorized")
        cat_totals[cat] = cat_totals.get(cat, 0) + qty

    categories = [{"category": k, "quantity": v} for k, v in cat_totals.items()]
    return {"response": "success", "categories": categories}




# -------------------- Stats --------------------
@app.get("/stats")
def stats():
    try:
        users_count = userCollection.count_documents({})
    except Exception:
        users_count = 0
    try:
        tables_count = tablesCollection.count_documents({})
    except Exception:
        tables_count = 0
    try:
        orders_count = ordersCollection.count_documents({})
    except Exception:
        orders_count = 0
    return {
        "response": "success",
        "users": users_count,
        "tables": tables_count,
        "orders": orders_count,
    }