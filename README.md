# Mini ERP + CRM Operations Portal

A full-stack ERP/CRM system for wholesale/distribution companies. Built with **Node.js + TypeScript + Express + PostgreSQL** (backend) and **React + TypeScript + Vite** (frontend).

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start (Local)](#quick-start-local)
- [Docker Setup](#docker-setup)
- [Deployment Guide](#deployment-guide)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Default Credentials](#default-credentials)
- [Assumptions](#assumptions)

---

## ✅ Features

### 🔐 Authentication & Role-Based Access
- JWT-based login
- 4 roles: **Admin**, **Sales**, **Warehouse**, **Accounts**
- Route-level and API-level guards

### 👥 Customer CRM Module
- Full CRUD with search and pagination
- Customer types: Retail, Wholesale, Distributor
- Status tracking: Lead → Active → Inactive
- Follow-up date scheduling
- Notes and timeline follow-ups

### 📦 Product & Inventory Module
- Product catalog with SKU, category, pricing
- Real-time stock level tracking
- Stock movement log (IN/OUT with reasons)
- Low stock alerts
- Inventory value calculation

### 📋 Sales Challan Module
- Multi-product challan creation
- Draft → Confirmed → Cancelled lifecycle
- **Atomic stock deduction** on confirmation (Prisma transaction)
- Stock validation before confirmation
- **Product snapshot** storage (historical integrity)
- Auto-generated challan numbers (`CH-YYYYMM-XXXX`)
- **PDF export** (jsPDF + AutoTable)
- Stock reversal on cancellation

### 🔑 User Management (Admin only)
- Create users with assigned roles
- Activate/deactivate users

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Backend Runtime | Node.js 20 |
| Backend Language | TypeScript |
| Backend Framework | Express.js |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Frontend Framework | React 18 + TypeScript |
| Frontend Build | Vite 5 |
| Frontend Charts | Recharts |
| PDF Export | jsPDF + jsPDF-AutoTable |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |

---

## 🚀 Quick Start (Local)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)

### 1. Clone and set up

```bash
git clone <your-repo-url> erp-crm-portal
cd erp-crm-portal
```

### 2. Configure Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env and set your DATABASE_URL and JWT_SECRET
```

**.env configuration:**
```env
DATABASE_URL="postgresql://your_user:your_password@localhost:5432/erp_crm_db"
JWT_SECRET="your-random-secret-at-least-32-chars"
PORT=5000
CORS_ORIGIN=http://localhost:5173
```

### 3. Install and run Backend

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
npm run seed          # Seeds demo data + users
npm run dev           # Starts on http://localhost:5000
```

### 4. Configure and run Frontend

```bash
cd frontend
cp .env.example .env  # or create .env with:
# VITE_API_URL=http://localhost:5000/api/v1

npm install
npm run dev           # Starts on http://localhost:5173
```

---

## 🐳 Docker Setup (Recommended)

Run the entire stack with a single command:

```bash
# From project root
docker-compose up -d

# Seed data (first time only)
docker exec erp_crm_backend sh -c "cd /app && node dist/seed.js"
```

Access:
- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:5000/api/v1
- **Health check**: http://localhost:5000/health

Stop:
```bash
docker-compose down
# Remove volumes too:
docker-compose down -v
```

---

## 🌐 Deployment Guide

### Option 1: Free Cloud Deployment

| Service | Role | Free Tier |
|---|---|---|
| [Neon.tech](https://neon.tech) | PostgreSQL | Yes |
| [Render.com](https://render.com) | Backend (Node) | Yes |
| [Vercel](https://vercel.com) | Frontend (React) | Yes |

#### Step 1: Database (Neon)
1. Create account at https://neon.tech
2. Create a new project → copy the connection string
3. Use it as `DATABASE_URL`

#### Step 2: Backend (Render)
1. Connect GitHub repo at https://render.com
2. Create **Web Service** → select `backend/` folder
3. Build command: `npm install && npx prisma generate && npm run build && npx prisma migrate deploy`
4. Start command: `npm start`
5. Set environment variables from `.env.example`

#### Step 3: Frontend (Vercel)
1. Connect GitHub repo at https://vercel.com
2. Set root to `frontend/`
3. Set env var: `VITE_API_URL=https://your-backend.onrender.com/api/v1`
4. Deploy

### Option 2: AWS (Bonus)
- **RDS**: PostgreSQL instance (db.t3.micro — free tier)
- **ECS**: Docker container for backend
- **S3 + CloudFront**: Frontend static hosting
- **ALB**: Load balancer with SSL

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES_IN` | ❌ | Token expiry (default: `7d`) |
| `PORT` | ❌ | Server port (default: `5000`) |
| `CORS_ORIGIN` | ❌ | Frontend URL for CORS |
| `NODE_ENV` | ❌ | `development` or `production` |
| `AWS_ACCESS_KEY_ID` | ❌ | AWS S3 (optional bonus) |
| `AWS_SECRET_ACCESS_KEY` | ❌ | AWS S3 (optional bonus) |
| `AWS_S3_BUCKET` | ❌ | S3 bucket name (optional bonus) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL |

---

## 📚 API Documentation

Base URL: `http://localhost:5000/api/v1`

### Authentication
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/auth/login` | Login → returns JWT | Public |
| `GET` | `/auth/me` | Current user info | All |
| `POST` | `/auth/change-password` | Change password | All |

### Customers
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/customers` | List with pagination + search | Admin, Sales |
| `POST` | `/customers` | Create customer | Admin, Sales |
| `GET` | `/customers/:id` | Customer detail | Admin, Sales |
| `PUT` | `/customers/:id` | Update customer | Admin, Sales |
| `GET` | `/customers/:id/followups` | List follow-ups | Admin, Sales |
| `POST` | `/customers/:id/followups` | Add follow-up | Admin, Sales |
| `GET` | `/customers/stats` | CRM stats | Admin, Sales |

### Products
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/products` | List with search + low-stock filter | All |
| `POST` | `/products` | Create product | Admin, Warehouse |
| `GET` | `/products/:id` | Product detail | All |
| `PUT` | `/products/:id` | Update product | Admin, Warehouse |
| `DELETE` | `/products/:id` | Soft delete | Admin |
| `GET` | `/products/:id/stock-movements` | Movement log | Admin, Warehouse |
| `POST` | `/products/:id/stock-in` | Manual stock addition | Admin, Warehouse |
| `GET` | `/products/stats` | Inventory stats | All |

### Challans
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `GET` | `/challans` | List with filters | All |
| `POST` | `/challans` | Create (draft or confirmed) | Admin, Sales |
| `GET` | `/challans/:id` | Challan detail | All |
| `PUT` | `/challans/:id/confirm` | Confirm → deducts stock | Admin, Sales |
| `PUT` | `/challans/:id/cancel` | Cancel → reverses stock | Admin, Sales |
| `GET` | `/challans/stats` | Revenue stats | All |

### Users (Admin only)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/users` | List users |
| `POST` | `/users` | Create user |
| `PUT` | `/users/:id` | Update user |
| `DELETE` | `/users/:id` | Deactivate user |

> Import `postman_collection.json` into Postman for ready-to-use requests.

---

## 🔑 Default Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@erp.com` | `Admin@123` |
| Sales | `sales@erp.com` | `Sales@123` |
| Warehouse | `warehouse@erp.com` | `Warehouse@123` |
| Accounts | `accounts@erp.com` | `Accounts@123` |

> ⚠️ Change these before any production deployment!

---

## 📁 Project Structure

```
erp-crm-portal/
├── backend/
│   ├── prisma/schema.prisma     # Database schema
│   ├── src/
│   │   ├── config/              # App + DB configuration
│   │   ├── middleware/          # Auth, error, validation
│   │   ├── modules/
│   │   │   ├── auth/            # Login, JWT
│   │   │   ├── customers/       # CRM module
│   │   │   ├── products/        # Inventory module
│   │   │   ├── challans/        # Sales challan module
│   │   │   └── users/           # User management
│   │   ├── utils/               # Response helpers, generators
│   │   ├── app.ts               # Express setup
│   │   ├── server.ts            # Entry point
│   │   └── seed.ts              # Demo data seed
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # Axios + API modules
│   │   ├── context/             # Auth + Toast context
│   │   ├── components/Layout/   # Sidebar, Layout, PrivateRoute
│   │   ├── pages/               # All page components
│   │   │   ├── auth/
│   │   │   ├── dashboard/
│   │   │   ├── customers/
│   │   │   ├── products/
│   │   │   ├── challans/
│   │   │   └── users/
│   │   ├── types/               # TypeScript interfaces
│   │   └── index.css            # Design system
│   ├── Dockerfile
│   └── nginx.conf
├── .github/workflows/ci.yml     # GitHub Actions CI
├── docker-compose.yml           # Full stack Docker
├── postman_collection.json      # API collection
└── README.md
```

---

## 💡 Key Business Logic

1. **Atomic Stock Deduction**: Challan confirmation uses a Prisma `$transaction` to atomically deduct stock from all products and log movements — ensuring data consistency even under concurrent requests.

2. **Stock Validation**: Before confirming a challan, the API checks each product's available stock. If insufficient, it returns a descriptive error identifying the specific product.

3. **Product Snapshots**: Challan items store a JSON snapshot of the product at the time of challan creation. This ensures historical data integrity even if the product is edited or deleted later.

4. **Stock Reversal**: Cancelling a confirmed challan reverses all stock deductions with appropriate movement log entries.

---

## 🏗 Assumptions

1. Single-tenant system (one company)
2. Currency is INR (Indian Rupees)
3. GST number validation uses standard Indian format regex
4. PDF export is client-side using jsPDF
5. Product images stored as URLs (direct S3 URL if using S3)
6. No email/SMS notifications in v1
7. Soft deletes for users and products (isActive flag)
