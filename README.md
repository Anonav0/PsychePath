# PsychePath — Psychometric Learning Path Recommender

PsychePath is an AI-enhanced personalized learning platform that tailors educational curricula based on learner profile information, psychometric assessment results, cognitive learning preferences, existing skills, and target goals.

---

## Technology Stack

- **Frontend**: Next.js (App Router), React, JavaScript, CSS Modules / Modern CSS
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
│   │   ├── User.js             # User accounts & RBAC roles
│   │   ├── Assessment.js       # Assessment definitions & dimensions
│   │   ├── Question.js         # Assessment questions & option scoring
│   │   ├── AssessmentAttempt.js# Student attempts & computed scores
│   │   ├── LearnerProfile.js   # Learner skills, goals & psychometrics
│   │   ├── CurriculumModule.js # Modules, prerequisites & resources
│   │   ├── LearningPath.js     # Recommended curriculum paths & AI metadata
│   │   ├── Progress.js         # Granular module progress (0-100%)
│   │   └── index.js            # Centralized model exports
│   ├── routes/                 # API route definitions
│   ├── services/               # Business logic layer
│   ├── utils/                  # Response formatters, seeders & verifiers
│   │   ├── apiResponse.js      # Standard JSON response helpers
│   │   ├── seed.js             # Development database seeder
│   │   └── verifyModels.js     # Schema validation & integrity test suite
│   ├── validators/             # Request payload validators
│   ├── app.js                  # Express application setup
│   └── server.js               # Entry point and server lifecycle
│
├── .docs/                      # Project documentation and specifications
│   ├── master.md
│   ├── prompt1.md
│   ├── prompt2.md
│   └── walkthroughs/           # Phase walkthroughs and instructions
│
├── package.json                # Monorepo root script runner
└── README.md
```

---

## Database Architecture

```text
       ┌──────────────┐
       │     User     │
       └──────┬───────┘
              │ (1:1)
              ├─────────────────────────────► LearnerProfile
              │                                      │
              │ (1:N)                                │ (latest scores)
              ├─────────────────────────────► AssessmentAttempt ◄───┐
              │                                      │               │
              │ (1:N)                                │               │
              ├─────────────────────────────► LearningPath           │
              │                                      │               │
              │ (1:N)                                │ (ordered)     │
              └──────────────► Progress              ▼               │
                                  │           CurriculumModule       │
                                  │                  │ (prereqs)     │
                                  └──────────────────┴───────────────┘

Assessment (1:N) ──► Question
Assessment (1:N) ──► AssessmentAttempt
```

---

## Prerequisites

- **Node.js**: `v18.x` or higher (tested on Node `v20.18.0`)
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

---

## Database Operations (Phase 2)

### Seed Development Data

Populate the database with realistic sample users, psychometric assessments, questions, curriculum modules, learner profiles, and learning paths:

```bash
npm run seed
```

### Run Model Verification & Constraint Tests

Run automated tests verifying schema constraints, unique indexes, enum validations, and document population:

```bash
npm run test:models
```

---

## Authentication & Role-Based Access Control (Phase 3)

PsychePath provides stateless JWT authentication with bcrypt password hashing and RBAC (`STUDENT` / `ADMIN`).

### Run Automated Security & Auth Test Suite

```bash
npm run test:auth
```

### Authentication REST Endpoints

- `POST /api/auth/register`: Public student registration (role forced to `STUDENT`)
- `POST /api/auth/login`: Credential authentication returning signed JWT
- `GET /api/auth/me`: Protected profile query (`Authorization: Bearer <token>`)
- `GET /api/auth/student-test`: Protected route verifying `STUDENT` role access
- `GET /api/auth/admin-test`: Protected route verifying `ADMIN` role access (returns 403 for students)

---

## Assessment Engine (Phase 4)

PsychePath includes a generic, backend-authoritative psychometric assessment engine.

### Scoring Architecture

> **Security Note**: Scoring is performed entirely on the backend. The client never determines or submits authoritative scores. Client scoring payloads are strictly ignored and sanitized.

```text
Assessment
    ↓
Questions (sanitized: scoring keys hidden from students)
    ↓
Student Attempt (IN_PROGRESS)
    ↓
Submitted Answers (auto-saved incrementally)
    ↓
Backend Validation (completeness check, option verification)
    ↓
Scoring Engine (authoritative DB option lookup)
    ↓
Dimension Scores & Normalization (0–100%)
    ↓
Assessment Result (educational summary, strongest dimensions, development areas)
```

### Supported Assessment Types

- `LEARNING_STYLE`: Cognitive problem-solving, study habits, collaboration preferences
- `SKILLS`: Technical skill proficiency evaluations
- `PERSONALITY_PROFILE`: Self-management, persistence, communication traits
- `GENERAL`: Extensible generic diagnostics

### Attempt Lifecycle

```text
[Start Attempt] ──► IN_PROGRESS ──► [Auto-save Answers] ──► [Submit Attempt] ──► COMPLETED (Scored)
```

- A student has at most one active (`IN_PROGRESS`) attempt per assessment at any given time.
- Inactive assessments cannot be started.
- Completed attempts are permanently locked against modifications or re-submissions.
- Assessment results are protected by strict IDOR checks.

### Run Automated Assessment Test Suite

```bash
npm run test:assessment
```

### Assessment Engine Endpoints

| Method   | Endpoint                               | Role             | Purpose                                               |
| :------- | :------------------------------------- | :--------------- | :---------------------------------------------------- |
| `GET`    | `/api/assessments`                     | Public / Student | List active assessments (scoring keys stripped)       |
| `POST`   | `/api/assessments`                     | `ADMIN`          | Create new assessment                                 |
| `GET`    | `/api/assessments/:id`                 | Public / Student | Get assessment instructions and details               |
| `PATCH`  | `/api/assessments/:id`                 | `ADMIN`          | Update assessment details                             |
| `PATCH`  | `/api/assessments/:id/status`          | `ADMIN`          | Activate or deactivate assessment                     |
| `DELETE` | `/api/assessments/:id`                 | `ADMIN`          | Safe soft-delete / deactivate if attempts exist       |
| `GET`    | `/api/assessments/:id/questions`       | Public / Student | Get ordered questions (scores stripped for students)  |
| `POST`   | `/api/assessments/:id/questions`       | `ADMIN`          | Create question with scoring rules                    |
| `PATCH`  | `/api/questions/:id/order`             | `ADMIN`          | Reorder question sequence                             |
| `POST`   | `/api/assessments/:id/attempts`        | `STUDENT`        | Start new attempt or resume active attempt            |
| `GET`    | `/api/assessments/:id/attempts/active` | `STUDENT`        | Get current active attempt                            |
| `PATCH`  | `/api/attempts/:id/answers`            | `STUDENT`        | Save / update answers (anti-tamper sanitized)         |
| `POST`   | `/api/attempts/:id/submit`             | `STUDENT`        | Submit attempt, validate completion, calculate scores |
| `GET`    | `/api/attempts/:id/result`             | `STUDENT`        | View scored results and dimension breakdown           |
| `GET`    | `/api/attempts/my`                     | `STUDENT`        | View student's assessment attempt history             |
| `GET`    | `/api/attempts`                        | `ADMIN`          | View all learner attempts across the platform         |

---

## Learner Profile System (Phase 5)

PsychePath structures learner data into a clean profile that balances student self-managed information with authoritative assessment-derived psychometrics.

### Data Source Separation

| Category               | Attributes                                                                                                                                              | Controlled By          | Endpoints                                                  |
| :--------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------- | :--------------------------------------------------------- |
| **User-Managed**       | `educationLevel`, `experienceLevel`, `currentSkills`, `learningGoals`, `interests`, `learningPreferences`, `preferredDifficulty`, `weeklyLearningHours` | Student                | `PATCH /api/profile/me`                                    |
| **Assessment-Derived** | `assessmentDimensions`, `strengths`, `improvementAreas`, `lastAssessmentAttempt`, `profileVersion`                                                      | Backend Scoring Engine | `POST /api/profile/me/generate-from-assessment/:attemptId` |

_Note: Direct client attempts to spoof or overwrite assessment-derived fields via `PATCH /api/profile/me` are strictly rejected (`400 PROFILE_UPDATE_INVALID`)._

### Deterministic Thresholds (Non-Clinical)

- **Strengths**: Dimension score $\ge 75\%$
- **Neutral / Developing**: $60\% \le \text{Score} < 75\%$
- **Development Areas**: Dimension score $< 60\%$

### Profile Completeness Calculation

Deterministic weighted score (0–100%):

- **Education**: 15%
- **Current Skills**: 20%
- **Learning Goals**: 20%
- **Interests**: 10%
- **Preferences**: 10%
- **Assessment**: 25%

### Run Automated Profile Test Suite

```bash
npm run test:profile
```

### Learner Profile Endpoints

| Method  | Endpoint                                              | Role               | Purpose                                                       |
| :------ | :---------------------------------------------------- | :----------------- | :------------------------------------------------------------ |
| `GET`   | `/api/profile/me`                                     | `STUDENT`, `ADMIN` | Get authenticated student's profile & completeness            |
| `PATCH` | `/api/profile/me`                                     | `STUDENT`, `ADMIN` | Update user-managed attributes                                |
| `POST`  | `/api/profile/me`                                     | `STUDENT`, `ADMIN` | Alternative initialization/update                             |
| `POST`  | `/api/profile/me/generate-from-assessment/:attemptId` | `STUDENT`, `ADMIN` | Convert completed assessment into profile & increment version |
| `GET`   | `/api/profiles/:userId`                               | `ADMIN`            | Inspect learner profile by user ID                            |

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
  "timestamp": "2026-09-20T18:03:34.973Z",
  "database": "connected",
  "uptime": 9
}
```

Open `http://localhost:3000` in your browser. The landing page queries `GET /api/health` and displays **Backend Status: Connected** with live response latency and database connection state.
