# MilesConnect - Fleet Management System

A modern fleet management and logistics platform built with Next.js 16 and Express.js. MilesConnect helps transportation companies manage their vehicles, drivers, shipments, trip sheets, maintenance schedules, and billing operations.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)

## 🚀 Features

- **Dashboard** - Real-time overview of fleet operations and KPIs
- **Fleet Management** - Live vehicle tracking with Mapbox integration
- **Vehicle Management** - Add, edit, and manage vehicle inventory
- **Driver Management** - Driver profiles and assignment tracking
- **Shipment Tracking** - End-to-end shipment lifecycle management
- **Trip Sheets** - Create and manage trip documentation
- **Maintenance Scheduling** - Vehicle maintenance cycle tracking
- **Billing & Invoicing** - Invoice generation and payment tracking
- **Document Management** - Store and organize important documents (POD, RC, Insurance, etc.)

## 📁 Project Structure

```
milesconnect/
├── readme.md
└── milesconnect-web/
    ├── app/                    # Next.js App Router pages
    │   ├── dashboard/          # Dashboard pages
    │   ├── (dashboard)/        # Dashboard route group
    │   │   ├── billing/
    │   │   ├── documents/
    │   │   ├── fleet/
    │   │   ├── maintenance/
    │   │   ├── shipments/
    │   │   ├── trip-sheets/
    │   │   └── vehicles/
    │   └── api/                # API routes (proxy)
    ├── lib/                    # Shared utilities
    ├── types/                  # TypeScript types
    ├── public/                 # Static assets
    └── backend/                # Express.js API
        ├── src/
        │   ├── controllers/    # Route controllers
        │   ├── routes/         # API routes
        │   ├── middlewares/    # Express middlewares
        │   ├── services/       # Business logic
        │   └── prisma/         # Prisma client
        └── prisma/
            ├── schema.prisma   # Database schema
            ├── migrations/     # Database migrations
            └── seed.ts         # Seed data
```

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: TanStack React Query
- **Maps**: Mapbox GL

### Backend

- **Framework**: Express.js 5
- **Language**: TypeScript 5
- **ORM**: Prisma 6
- **Database**: PostgreSQL 16
- **Validation**: Zod

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Docker** & Docker Compose ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/itanishqshelar/milesconnect-prototype.git
cd milesconnect-prototype
```

### 2. Set Up the Backend

#### 2.1 Navigate to the backend directory

```bash
cd milesconnect-web/backend
```

#### 2.2 Install dependencies

```bash
npm install
```

#### 2.3 Create environment file

Create a `.env` file in the `milesconnect-web/backend` directory:

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/milesconnect?schema=public"

# Server
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000
```

#### 2.4 Start the PostgreSQL database

```bash
npm run db:up
```

This command starts a PostgreSQL 16 container using Docker Compose.

#### 2.5 Run database migrations

```bash
npm run prisma:migrate
```

#### 2.6 Seed the database (optional)

```bash
npm run prisma:seed
```

#### 2.7 Start the backend server

```bash
npm run dev
```

The backend API will be running at `http://localhost:3001`

### 3. Set Up the Frontend

#### 3.1 Open a new terminal and navigate to the frontend directory

```bash
cd milesconnect-web
```

#### 3.2 Install dependencies

```bash
npm install
```

#### 3.3 Create environment file (optional)

Create a `.env.local` file in the `milesconnect-web` directory:

```bash
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Mapbox (for fleet tracking map)
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_access_token
```

#### 3.4 Start the development server

```bash
npm run dev
```

The frontend will be running at `http://localhost:3000`

### 4. Access the Application

Open your browser and navigate to `http://localhost:3000`. You will be redirected to the dashboard.

## 📝 Available Scripts

### Frontend (`milesconnect-web/`)

| Command         | Description              |
| --------------- | ------------------------ |
| `npm run dev`   | Start development server |
| `npm run build` | Build for production     |
| `npm run start` | Start production server  |
| `npm run lint`  | Run ESLint               |

### Backend (`milesconnect-web/backend/`)

| Command                   | Description                              |
| ------------------------- | ---------------------------------------- |
| `npm run dev`             | Start development server with hot reload |
| `npm run build`           | Compile TypeScript to JavaScript         |
| `npm run start`           | Start production server                  |
| `npm run db:up`           | Start PostgreSQL container               |
| `npm run db:down`         | Stop PostgreSQL container                |
| `npm run db:reset`        | Reset database (delete all data)         |
| `npm run prisma:generate` | Generate Prisma client                   |
| `npm run prisma:migrate`  | Run database migrations                  |
| `npm run prisma:seed`     | Seed the database                        |
| `npm run prisma:reset`    | Reset and reseed database                |

## 🗄️ Database Schema

The application uses the following main entities:

- **User** - System users with roles (Admin, Manager, Driver)
- **Driver** - Driver profiles linked to users
- **Vehicle** - Fleet vehicles with status tracking
- **Shipment** - Shipment records with lifecycle states
- **TripSheet** - Trip documentation with fuel and expense tracking
- **Invoice** - Billing and payment records
- **Document** - File attachments (POD, Insurance, License, etc.)
- **MaintenanceCycle** - Vehicle maintenance schedules

## 🔌 API Endpoints

The backend exposes RESTful APIs at `http://localhost:3001`:

| Route              | Description           |
| ------------------ | --------------------- |
| `/api/dashboard`   | Dashboard statistics  |
| `/api/drivers`     | Driver management     |
| `/api/vehicles`    | Vehicle management    |
| `/api/shipments`   | Shipment tracking     |
| `/api/trip-sheets` | Trip sheet operations |
| `/api/invoices`    | Invoice management    |
| `/api/documents`   | Document management   |
| `/api/fleet`       | Fleet tracking data   |

## 🐳 Docker Commands

```bash
# Start database
docker compose up -d

# Stop database
docker compose down

# Stop and remove all data
docker compose down -v

# View logs
docker compose logs -f db
```

## 🔧 Troubleshooting

### Database connection issues

1. Ensure Docker is running
2. Check if port 5432 is available
3. Verify the DATABASE_URL in your `.env` file

### Prisma issues

```bash
# Regenerate Prisma client
npm run prisma:generate

# Reset database completely
npm run prisma:reset
```

### Port conflicts

- Frontend default: 3000
- Backend default: 3001
- PostgreSQL default: 5432

Change ports in respective configuration files if needed.

## 🔄 Recent Changes & Improvements

### New Features

- **ML Service Integration**: Added a dedicated Python-based Machine Learning service (`ml-service`) for advanced analytics, including:
- **Dynamic Forecasting Fallback**: implemented a robust fallback mechanism in the backend. If the ML service is unavailable, the system automatically defaults to a historical moving average ensuring dashboard continuity.

### Bug Fixes & Enchancements

- **Fleet Utilization Widget**: Fixed backend logic to correctly categorize vehicles as "IN_USE" based on active trip sheets, ensuring the dashboard reflects real-time fleet status.
- **Shipment Creation**: Resolved a "500 Internal Server Error" during shipment creation by fixing the `createdById` fallback logic and correcting Prisma client imports.
- **Vehicle Deletion**: Fixed the unresponsive "Delete Vehicle" button by implementing a custom confirmation UI. Added robust error handling to prevent deletion of vehicles with active dependencies (shipments/trip sheets) and display clear error messages.
- **Driver Creation**: Corrected Zod validation schemas in the backend to resolve "Invalid request body" errors, allowing for successful driver profile creation.
- **General Stability**: Addressed various initial setup and configuration issues to ensure a smoother out-of-the-box experience for new deployments.
