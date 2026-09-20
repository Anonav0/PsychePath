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

## Curriculum System (Phase 6)

PsychePath provides a structured curriculum knowledge base representing independently learnable units of software engineering, database systems, AI/data science, and DevOps.

### Graph-Based Prerequisites & Cycle Detection

- **DFS Cycle Detection**: Prerequisites form a Directed Acyclic Graph (DAG). Whenever prerequisites are assigned or updated, the system evaluates all transitive connections to reject self-referencing and circular loops (`400 CURRICULUM_CIRCULAR_DEPENDENCY`).
- **Safe Soft Deactivation**: Deleting a module that has active dependents does not hard-delete or orphan relationships; instead, it safely soft-deactivates the module (`isActive = false`) to preserve prerequisite integrity.
- **Resource URL Sanitization**: Enforces strict URL scheme validation (`http://` and `https://` only); dangerous schemes (`javascript:`, `data:`, `file:`) are rejected.

### Run Automated Curriculum Test Suite

```bash
npm run test:curriculum
```

### Curriculum REST Endpoints

| Method   | Endpoint                             | Role               | Purpose                                                           |
| :------- | :----------------------------------- | :----------------- | :---------------------------------------------------------------- |
| `GET`    | `/api/curriculum/modules`            | `STUDENT`, `ADMIN` | Browse curriculum (filtered, paginated, active-only for students) |
| `GET`    | `/api/curriculum/modules/:id`        | `STUDENT`, `ADMIN` | Get module details with populated prerequisite metadata           |
| `POST`   | `/api/curriculum/modules`            | `ADMIN`            | Create module with prerequisite cycle detection                   |
| `PATCH`  | `/api/curriculum/modules/:id`        | `ADMIN`            | Update module & modify prerequisites with cycle prevention        |
| `PATCH`  | `/api/curriculum/modules/:id/status` | `ADMIN`            | Toggle module active/inactive status                              |
| `DELETE` | `/api/curriculum/modules/:id`        | `ADMIN`            | Safe deletion / soft deactivation when dependents exist           |

---

## Recommendation Engine (Phase 7)

PsychePath connects learner profiles to the curriculum using a transparent, deterministic rule-based recommendation engine.

### Scoring Architecture

```text
Learner Profile (Goals, Skills, Psychometrics, Preferences)
          │
          ▼
Candidate Generation & Prerequisite Check
          │
          ▼
Multi-Factor Normalized Scoring (0–100)
  ├── Goal Match (25%)
  ├── Skill Match & Gap Detection (25%)
  ├── Prerequisite Readiness (15%)
  ├── Assessment Alignment (15%)
  ├── Difficulty / Experience Alignment (10%)
  ├── Interest Match (5%)
  └── Learning Preferences (5%)
          │
          ▼
Deterministic Sorting & Tie-Breaking
          │
          ▼
Actionable Recommendations + Blocked Modules + Grounded Reasons
```

### Run Automated Recommendation Test Suite

```bash
npm run test:recommendations
```

### Recommendation REST Endpoints

| Method | Endpoint                       | Role               | Purpose                                                               |
| :----- | :----------------------------- | :----------------- | :-------------------------------------------------------------------- |
| `GET`  | `/api/recommendations`         | `STUDENT`, `ADMIN` | Retrieve ranked recommendations, score breakdown, and blocked modules |
| `GET`  | `/api/recommendations/modules` | `STUDENT`, `ADMIN` | Alias endpoint for recommendations query                              |

---

## AI Recommendation Architecture (Phase 8: Gemini AI Integration)

PsychePath integrates Google Gemini AI as an explainable, personalized recommendation service layer that acts strictly on top of Phase 7's deterministic engine.

> **Core Architectural Principle**:
> Rules determine what can be recommended; Gemini determines how valid recommendations are personalized and explained.

### AI Personalization Flow

```text
Learner Profile (Goals, Skills, Psychometrics, Preferences)
          │
          ▼
Deterministic Candidate Selection (Phase 7 Engine)
          │
          ▼
Gemini AI Personalization Service
  ├── System Directives (Zero Hallucination, Non-Clinical)
  ├── Untrusted User Data Quarantine (Prompt Injection Defense)
  └── Candidate Set Payload (max 10 modules)
          │
          ▼
Structured JSON Validation
  ├── Schema Integrity (summary, focusAreas, learningStrategy, sequence)
  └── Hallucination Pruning (moduleIds must exist in candidate set)
          │
          ▼
Prerequisite DAG Validation & Reordering
  └── Kahn's Topological Sort (repairs any inadvertent prerequisite inversions)
          │
          ├── (AI Success) ──► HYBRID Response (Personalized Narrative, Focus Areas, Sequence)
          │
          └── (Failure / Timeout / Quota) ──► RULE_ENGINE Fallback (Zero Downtime)
```

### Safety & Integrity Boundaries

- **Curriculum Integrity**: Gemini is strictly prohibited from inventing module IDs, courses, resources, or skills. Any returned module ID not present in the pre-approved candidate list is pruned.
- **Prerequisite Preservation**: The backend guarantees that prerequisite relationships (DAG) can never be violated by AI ordering. If Gemini suggests Module B before required Module A, the system topologically reorders them.
- **Prompt Injection Protection**: All learner-provided text (goals, skills, interests) is quarantined in isolated JSON blocks and labeled as untrusted data to analyze, never instructions to follow.
- **Security & Secret Protection**: `GEMINI_API_KEY` exists strictly on the backend, is omitted from client bundles, excluded from API responses, and sanitized from server logs.

### Configuration & Environment

Add the following to `server/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-flash-latest
GEMINI_TIMEOUT_MS=15000
GEMINI_MAX_RETRIES=2
AI_MAX_CANDIDATES=10
```

### Run Automated Gemini Test Suite

The test suite runs with zero network dependency using isolated mocks and stubs:

```bash
npm run test:gemini
```

Or from server directory:

```bash
npm run test:gemini --prefix server
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
  "timestamp": "2026-09-20T18:03:34.973Z",
  "database": "connected",
  "uptime": 9
}
```

Open `http://localhost:3000` in your browser. The landing page queries `GET /api/health` and displays **Backend Status: Connected** with live response latency and database connection state.
