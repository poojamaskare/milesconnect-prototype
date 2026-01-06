# MilesConnect

Full-stack fleet management system with route optimization, predictive maintenance, and real-time analytics.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (Next.js)                        │
│                         localhost:3000                              │
└───────────────┬─────────────────────────────┬───────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────┐   ┌─────────────────────────────────────┐
│   Backend API (Express)   │   │    Optimization Service (Go)        │
│      localhost:3001       │   │         localhost:8081              │
│                           │   │                                     │
│  - Shipments CRUD         │   │  - Load Optimization (Bin Packing)  │
│  - Vehicles CRUD          │   │  - Route Optimization (TSP)         │
│  - Drivers CRUD           │   │  - Fleet Allocation                 │
│  - Documents              │   │                                     │
│  - Billing                │   └─────────────────────────────────────┘
└───────────────┬───────────┘
                │
                ▼
┌───────────────────────────┐   ┌─────────────────────────────────────┐
│   Database (SQLite)       │   │      ML Service (FastAPI)           │
│                           │   │         localhost:8000              │
│  - Prisma ORM             │   │                                     │
│  - Auto-migrations        │   │  - Delay Prediction (XGBoost)       │
└───────────────────────────┘   │  - Driver Scoring                   │
                                │  - Fuel Anomaly Detection           │
                                │  - Maintenance Prediction           │
                                └─────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, TanStack Query |
| Backend API | Node.js, Express, Prisma ORM, SQLite |
| Optimization Service | Go 1.21+, Standard Library |
| ML Service | Python 3.10+, FastAPI, XGBoost, Scikit-learn |

## Features

### Dashboard Modules
- **Fleet Map**: Real-time vehicle tracking with status indicators
- **Shipments**: Delivery management with route visualization
- **Vehicles**: Asset management with maintenance scheduling
- **Drivers**: Driver profiles with performance metrics
- **Analytics**: KPIs, charts, and trend analysis
- **Billing**: Invoice generation and payment tracking
- **Documents**: Compliance and document management

### Optimization Engine (Go Service)
- **Load Optimizer**: Best-Fit Decreasing algorithm for weight-based vehicle allocation
- **Route Optimizer**: Nearest Neighbor TSP for multi-stop route planning
- **Fleet Allocation**: Assigns shipments to vehicles based on capacity constraints

### Machine Learning Models
- **Delay Prediction**: XGBoost classifier trained on traffic and weather data
- **Driver Scoring**: Performance rating (0-100) based on safety and efficiency
- **Fuel Anomaly Detection**: Isolation Forest for identifying fuel theft patterns
- **Maintenance Prediction**: Failure prediction based on vehicle telemetry
- **ETA Estimation**: Arrival time calculation with route factors

## Installation

### Prerequisites
- Node.js 18+
- Python 3.10+
- Go 1.21+
- npm or yarn

### 1. Clone Repository
```bash
git clone https://github.com/itanishqshelar/milesconnect-prototype.git
cd milesconnect-prototype/milesconnect-web
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run build
npm start
```
Server runs on `http://localhost:3001`

### 3. ML Service Setup
```bash
cd ml-service
python -m venv venv

# Windows
.\venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python src/api/app.py
```
Server runs on `http://localhost:8000`

### 4. Optimization Service Setup
```bash
cd optimization-service
go run cmd/server/main.go
```
Server runs on `http://localhost:8081`

### 5. Frontend Setup
```bash
# From project root
npm install
npm run dev
```
Application runs on `http://localhost:3000`

## API Endpoints

### Backend API (Port 3001)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/vehicles | List all vehicles |
| POST | /api/vehicles | Create vehicle |
| GET | /api/shipments | List shipments |
| POST | /api/shipments | Create shipment |
| GET | /api/drivers | List drivers |
| POST | /api/routing/optimize | Calculate optimized route |

### Optimization Service (Port 8081)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /optimize | TSP route optimization |
| POST | /optimize-load | Fleet allocation by weight |
| GET | /health | Service health check |

### ML Service (Port 8000)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /predict/delay | Predict shipment delay |
| POST | /predict/eta | Estimate arrival time |
| GET | /driver-score/{id} | Get driver performance score |
| GET | /health | Service health check |

## Project Structure

```
milesconnect-prototype/
├── readme.md
├── milesconnect-web/
│   ├── app/                      # Next.js App Router pages
│   │   ├── dashboard/
│   │   │   ├── analytics/
│   │   │   ├── billing/
│   │   │   ├── drivers/
│   │   │   ├── fleet/
│   │   │   ├── maintenance/
│   │   │   ├── optimization/     # Load and Route Optimizer UI
│   │   │   ├── shipments/
│   │   │   └── vehicles/
│   │   └── layout.tsx
│   ├── backend/                  # Express API server
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── routes/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── optimization-service/     # Go optimization service
│   │   ├── cmd/server/
│   │   └── internal/
│   │       ├── api/
│   │       ├── data/
│   │       ├── models/
│   │       └── solver/
│   ├── components/               # Shared React components
│   └── lib/                      # Utilities and hooks
└── ml-service/                   # Python ML service
    └── src/
        ├── api/
        ├── models/
        └── training/
```

## Configuration

### Environment Variables

**Backend (.env)**
```
DATABASE_URL="file:./dev.db"
PORT=3001
```

**ML Service**
```
PORT=8000
```

**Optimization Service**
```
PORT=8081
```

## Development

### Running All Services
Open four terminal windows:

```bash
# Terminal 1: Backend
cd milesconnect-web/backend && npm start

# Terminal 2: ML Service
cd ml-service && python src/api/app.py

# Terminal 3: Optimization Service
cd milesconnect-web/optimization-service && go run cmd/server/main.go

# Terminal 4: Frontend
cd milesconnect-web && npm run dev
```

### Building for Production

**Frontend**
```bash
npm run build
npm start
```

**Backend**
```bash
cd backend
npm run build
npm start
```

## Testing

### Verify Service Health
```bash
# Backend
curl http://localhost:3001/api/health

# ML Service
curl http://localhost:8000/health

# Optimization Service
curl http://localhost:8081/health
```

### Test Optimization Endpoint
```bash
curl -X POST http://localhost:8081/optimize-load \
  -H "Content-Type: application/json" \
  -d '{"vehicles":[{"id":"truck1","capacity_kg":40000,"current_load":0}],"shipments":[{"id":"s1","weight_kg":32000}]}'
```

## Database Schema

Core entities managed by Prisma:

- **Vehicle**: Registration, make, model, capacity, maintenance status
- **Driver**: License, contact, performance score, status
- **Shipment**: Origin, destination, weight, status, assigned vehicle/driver
- **Trip**: Route, distance, fuel, expenses, revenue
- **Document**: Type, expiry, file storage reference


