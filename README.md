# 🍽️ Dine Delight - Smart Restaurant Management System

A modern, full-stack restaurant system built with **FastAPI**, **MongoDB**, and **Vanilla JavaScript**, designed for smart table ordering, reservation, and food delivery.

---

## ✅ Features

### 👤 Authentication
- User registration and login with email & password
- Input validation with `pydantic`
- MongoDB-based user storage

### 🧾 Menu & Ordering
- View dynamic menu (to be implemented)
- Add to cart, place orders, view history

### 📲 QR Table Ordering
- Scan a QR on the table to start ordering
- Pre-fills table number automatically

### 🪑 Table Reservation
- Book a table by selecting date, time, and table
- Prevents double booking

### 👨‍🍳 Admin & Staff Dashboard
- View all orders & reservations
- Update order status
- Manage menu items

### 📊 Analytics (optional)
- Most ordered items
- Peak time insights

---

## ⚙️ Tech Stack

| Frontend        | Backend         | Database     |
|-----------------|-----------------|--------------|
| HTML, CSS, JS   | FastAPI (Python) | MongoDB Atlas |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/smart-restaurant.git
cd smart-restaurant
```

### 2. Set up virtual environment

```bash
python3 -m venv smartRestaurant
source smartRestaurant/bin/activate  # Mac/Linux
smartRestaurant\Scripts\activate   # Windows
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Setup environment variables

Create a `.env` file in the `/backend` folder with:

```
MONGO_URI=your_mongodb_uri_here
```

### 5. Run FastAPI backend

```bash
uvicorn main:app --reload
```

### 6. Open Frontend

Open `frontend/pages/signup/index.html` in your browser and try registering a user.

---

## 🍔 Seed Initial Data

If your database is empty (e.g., after a reset) and the menu shows no dishes, seed default dishes and tables:

1) Ensure `backend/.env` has a valid `MONGO_URI`.

2) Run the seeder:

```bash
cd backend
python3 seed_data.py
```

This inserts commonly used dishes whose images already exist in `pages/menu/dishes/`, and a few default tables. Re-run the command any time; it upserts by dish name.

---

## 📁 Project Structure

```
Smart-Restaurant/
├── backend/
│   ├── main.py
│   ├── test.py
│   └── .env
├── frontend/
│   └── pages/
│       ├── signup/
│       └── login/
├── assets/
│   └── logo.png, background.jpeg
```

---

## 📌 To Do
- [ ] Implement dynamic menu
- [ ] Create order system
- [ ] Add reservation logic
- [ ] Build staff/admin dashboard
- [ ] Add role-based access

---

## 👨‍💻 Author

Made with ❤️ by Pranshu Tripathi

---

## 📄 License

This project is licensed under the MIT License.