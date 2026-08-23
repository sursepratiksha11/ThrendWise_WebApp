# TrendWise (React + Vite)

TrendWise is now configured as a React app (Vite) for the frontend, with the existing Express backend in `backend/` and Python AI service in `ai-service/`.

## Run Frontend

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Run Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs at `http://localhost:4000`.

## Run AI Service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

AI service runs at `http://localhost:8000`.

## Environment Variables

Frontend (`.env`):

```bash
VITE_API_BASE_URL=http://localhost:4000
```

Backend (`backend/.env`):

```bash
PORT=4000
OPENAI_API_KEY=your_key_here
AI_SERVICE_URL=http://127.0.0.1:8000
MONGODB_URI=your_mongodb_connection
```
# TrendWise AI Finance Platform

## Resume-ready statement
Built an AI-powered finance platform that predicts stock trends and provides financial recommendations using machine learning and OpenAI APIs.

## Architecture
- Frontend: Next.js (React), Tailwind-ready UI, Recharts-friendly data endpoints
- Backend: Node.js + Express orchestration API
- AI/ML Service: Python FastAPI with Linear Regression and Isolation Forest models
- Database: MongoDB (stock history storage)
- External APIs: Yahoo Finance (price data), OpenAI API (chatbot)

## Request flow
User -> React frontend -> Backend API -> Python ML model / OpenAI API -> Response -> UI charts and insights

## Folder layout
- frontend app (existing): src/app, src/components, src/lib
- backend: backend/index.js, backend/routes/*, backend/models/*
- ai service: ai-service/app/main.py

## Run locally

### 1) Frontend (Next.js)
- From project root:
- npm install
- npm run dev

### 2) Backend (Express)
- cd backend
- npm install
- copy .env.example to .env and set values
- npm run dev

### 3) AI service (FastAPI)
- cd ai-service
- python -m venv .venv
- .venv\Scripts\activate
- pip install -r requirements.txt
- uvicorn app.main:app --reload --port 8000

## Backend endpoints
- GET /health
- GET /api/stocks/:symbol
- POST /api/predict
- POST /api/chat
- POST /api/expenses/categorize
- POST /api/fraud/detect

## AI service endpoints
- GET /health
- POST /predict
- POST /categorize-expenses
- POST /detect-fraud

## Notes
- If OpenAI key is missing, chatbot endpoints return a safe configuration message.
- If MongoDB is unavailable, frontend home and sitemap routes now fail gracefully.
