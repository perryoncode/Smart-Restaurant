from pymongo import MongoClient
from dotenv import load_dotenv
import os


def main():
    load_dotenv()
    mongo_uri = "mongodb+srv://codewithperry:HyRnTHUK7gz0lbWt@cluster0.iub7ykj.mongodb.net/?appName=Cluster0"
    if not mongo_uri:
        raise RuntimeError("MONGO_URI is not set. Put it in backend/.env")

    client = MongoClient(mongo_uri)
    db = client["Restaurant"]
    dishes = db["dishes"]
    tables = db["tables"]

    seed_dishes = [
        {"name": "Brownie", "price": 120, "image": "brownie.jpeg", "category": "Dessert"},
        {"name": "Chole Bhature", "price": 150, "image": "chole-bhature.jpeg", "category": "Main"},
        {"name": "Fries", "price": 90, "image": "fries.jpeg", "category": "Snack"},
        {"name": "Maggie", "price": 80, "image": "maggie.jpeg", "category": "Snack"},
        {"name": "Momos", "price": 110, "image": "momos.jpeg", "category": "Snack"},
        {"name": "Panipuri", "price": 60, "image": "panipuri.jpeg", "category": "Street Food"},
        # Note: file is named "panner-tikka.jpeg" in pages/menu/dishes
        {"name": "Paneer Tikka", "price": 180, "image": "panner-tikka.jpeg", "category": "Starter"},
        {"name": "Soya Chaap", "price": 140, "image": "soya-chap.jpeg", "category": "Starter"},
    ]

    for d in seed_dishes:
        # Upsert by name so re-running keeps data fresh
        dishes.update_one({"name": d["name"]}, {"$set": d}, upsert=True)

    # If no tables exist, create a small default set
    if tables.count_documents({}) == 0:
        seed_tables = []
        # Tables 1-4: couple (2 seats), 5-8: family (4 seats)
        for i in range(1, 5):
            seed_tables.append({"table_id": i, "table_type": "couple", "seats": 2})
        for i in range(5, 9):
            seed_tables.append({"table_id": i, "table_type": "family", "seats": 4})
        if seed_tables:
            tables.insert_many(seed_tables)

    print("Seeding complete:")
    print(" - Dishes:", dishes.count_documents({}))
    print(" - Tables:", tables.count_documents({}))


if __name__ == "__main__":
    main()
