# PsychePath — Psychometric Learning Path Recommender

PsychePath is an AI-enhanced personalized learning platform that tailors educational curricula based on learner profile information, psychometric assessment results, cognitive learning preferences, existing skills, and target goals.

---

## Technology Stack

- **Frontend**: Next.js, React, JavaScript, CSS Modules / Modern CSS
- **Backend**: Node.js, Express.js, JavaScript (REST API)
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: Google Gemini API (Phase 4+)
- **Authentication**: JWT & Role-Based Access Control (Phase 3+)

---

## Project Structure

```text
psychepath/
├── client/                     # Next.js frontend application
│   ├── app/                    # Next.js App Router (pages & layouts)
│   ├── components/             # Reusable UI components
│   ├── features/               # Feature-based modular slices
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Shared client utilities
│   ├── services/               # Centralized API service layer
│   └── utils/                  # General helper functions
│
├── server/                     # Express.js REST API backend
│   ├── config/                 # Centralized environment & DB configs
│   ├── controllers/            # Request handlers
│   ├── middleware/             # Auth, error handling, validation middleware
│   ├── models/                 # Mongoose data models
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic layer
│   ├── utils/                  # Response formatters and utilities
│   ├── validators/             # Request payload validators
│   ├── app.js                  # Express application setup
│   └── server.js               # Entry point and server lifecycle
│
├── .docs/                      # Project documentation and specifications
│   ├── master.md
│   ├── prompt1.md
│   └── walkthroughs/           # Phase walkthroughs and instructions
│
├── package.json                # Monorepo root script runner
└── README.md
```

---

## Prerequisites

- **Node.js**: `v18.x` or higher (tested on Node v20)
- **npm**: `v9.x` or higher
- **MongoDB**: Local MongoDB daemon running at `mongodb://localhost:27017` or MongoDB Atlas URI

---

## Environment Configuration

Copy `.env.example` to create your local environment files:

### Backend (`server/.env`)

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/psychepath
JWT_SECRET=development_jwt_secret_phase1
GEMINI_API_KEY=development_gemini_key_phase1
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Frontend (`client/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Installation

Install dependencies across the monorepo root, backend, and frontend:

```bash
# From root directory
npm run install:all
```

Or install individually:

```bash
# Server dependencies
cd server && npm install

# Client dependencies
cd ../client && npm install
```

---

## Running the Application

### Option A: Run Concurrently from Root

```bash
npm run dev
```

Starts backend on `http://localhost:5000` and frontend on `http://localhost:3000`.

### Option B: Run Individually

**Start Backend Server**:

```bash
cd server
npm run dev
```

**Start Frontend Application**:

```bash
cd client
npm run dev
```

---

## Health Check & Verification

Once both servers are running, verify API health:

```bash
curl http://localhost:5000/api/health
```

Expected JSON response:

```json
{
  "success": true,
  "message": "PsychePath API is running",
  "timestamp": "2026-09-20T17:40:00.000Z"
}
```

Open `http://localhost:3000` in your browser. The landing page will query `GET /api/health` and display **Backend Status: Connected** with live response metadata.
