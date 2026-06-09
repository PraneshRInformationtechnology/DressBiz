# Dress Business Management System

A production-ready full-stack web application for clothing retailers to manage inventory, sales, customers, dues, and profits.

## Tech Stack

**Frontend:** React.js (Vite), React Router, Axios, Tailwind CSS, React Hook Form, Recharts, React Toastify  
**Backend:** Node.js, Express.js, JWT Authentication, bcrypt  
**Database:** MySQL

---

## Quick Start

### 1. Install MongoDB

- Download from https://www.mongodb.com/try/download/community
- Install and start MongoDB (it runs on `localhost:27017` by default)
- **No schema setup needed** — Mongoose auto-creates everything on first run

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Only change needed: set your MONGODB_URI if not using default
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Default Login

| Field    | Value             |
|----------|-------------------|
| Email    | admin@dress.com   |
| Password | Admin@123         |

> Change the default password after first login.

---

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/dress_business
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

---

## Features

### Dashboard
- Revenue, Profit, Dues, Inventory Value cards
- Monthly Sales & Profit trend charts
- Top Selling Products chart
- Today's & Monthly sales summary
- Low stock alert count

### Product Management
- Add/Edit/Delete products
- Category, brand, size, color tracking
- Purchase & selling price
- Stock quantity with low stock alerts

### Purchase Management
- Record stock purchases from suppliers
- Automatic stock quantity increment
- Purchase history

### Customer Management
- Add/Edit customers
- View customer profile with full purchase history
- Customer ledger (debit/credit running balance)

### Sales Management
- Create invoices with multiple items
- Auto-calculate profit at time of sale
- Payment status: PAID / PARTIALLY_PAID / UNPAID
- Automatic stock decrement

### Payment Collection
- Record partial or full payments
- Multiple methods: Cash, UPI, Bank Transfer
- Auto-updates customer dues and sale status
- Full ledger trail per customer

### Reports
- Sales Report (daily/weekly/monthly/custom)
- Inventory Report with low stock
- Outstanding Due Report
- Cash Flow Report by payment method
- Export to Excel and PDF

### User Management (Admin only)
- Add staff accounts
- Role-based access: Admin / Staff
- Enable/Disable users

---

## Folder Structure

```
dress-business/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   └── schema.sql
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── context/
    │   ├── pages/
    │   └── utils/
    ├── index.html
    └── package.json
```

---

## Profit Calculation Logic

Profit is calculated **at the time of sale**, not at payment collection.

```
itemProfit = (sellingPrice - costPrice) × quantity
totalProfit = SUM(itemProfit for all items)
```

Even if a customer hasn't paid yet, profit is recorded.

---

## Production Deployment

### Backend (PM2)
```bash
npm install -g pm2
cd backend
NODE_ENV=production pm2 start src/server.js --name dress-backend
```

### Frontend (Build)
```bash
cd frontend
npm run build
# Serve the dist/ folder via Nginx
```

### Nginx Config
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/dress-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Security Features
- JWT authentication with expiry
- bcrypt password hashing (10 rounds)
- Role-based access control (Admin/Staff)
- Helmet.js security headers
- Rate limiting (500 req/15min)
- SQL injection protection via parameterized queries

## License
MIT
