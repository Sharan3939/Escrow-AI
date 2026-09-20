# EscrowAI — AI-Powered Smart Escrow for Freelancers on Cardano

<p align="center">
  <strong>A full-stack Web3 platform for secure, transparent, and structured freelance escrow.</strong>
</p>

<p align="center">
  Built with Next.js, Express.js, PostgreSQL, Prisma, and designed for Cardano blockchain integration.
</p>

<p align="center">

**Status:** 🟢 Phase 1–2 Ready   |  
**Year:** 2026   |  
**License:** MIT

</p>

---

## 📌 Overview

**EscrowAI** is a full-stack freelance escrow platform designed to create a secure and transparent payment workflow between clients and freelancers.

The platform provides the foundation for a decentralized freelance marketplace where:

* Clients can create and manage projects.
* Freelancers can view assigned projects and submit deliverables.
* Project and escrow information is stored in a structured PostgreSQL database.
* Users authenticate using wallet-based identities and JWT authorization.
* The architecture is prepared for AI-powered verification and Cardano smart-contract settlement.

The project is being developed in phases, with **Phase 1 and Phase 2 currently ready** and subsequent Web3/AI capabilities being integrated as the project evolves.

---

# 🎯 Problem

Freelance transactions often depend on centralized platforms and manual processes.

Common challenges include:

* Lack of payment transparency
* Trust issues between clients and freelancers
* Payment disputes
* Unclear project requirements
* Manual deliverable verification
* Centralized control over project payments
* Limited visibility into project and escrow status

EscrowAI is designed to provide a structured foundation for addressing these problems through application-level escrow management, AI-assisted verification, and blockchain-based settlement.

---

# 💡 Proposed Solution

The long-term EscrowAI workflow is:

```text
Client
  │
  ▼
Create Project
  │
  ▼
Create Escrow
  │
  ▼
Fund Escrow
  │
  ▼
Freelancer Works
  │
  ▼
Submit Deliverable
  │
  ▼
AI Verification
  │
  ▼
Client Review
  │
  ├── Request Revision
  │
  ├── Raise Dispute
  │
  └── Approve
          │
          ▼
    Smart Contract
          │
          ▼
    Freelancer Wallet
```

The current repository provides the core application architecture required to build this workflow.

---

# 🏗️ Project Architecture

```text
                    ┌─────────────────────┐
                    │       Client        │
                    │    Web Browser      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Next.js Frontend  │
                    │                     │
                    │ Dashboard           │
                    │ Projects            │
                    │ Escrow UI           │
                    │ Freelancer UI       │
                    └──────────┬──────────┘
                               │
                          REST API
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Express Backend    │
                    │     TypeScript      │
                    │                     │
                    │ Authentication      │
                    │ Projects            │
                    │ Escrow              │
                    │ Submissions         │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ PostgreSQL /        │
                    │ Supabase            │
                    │                     │
                    │ Prisma ORM          │
                    └─────────────────────┘

                  Future Integration Layer

                    ┌─────────────────────┐
                    │    Gemini AI        │
                    │ Deliverable         │
                    │ Verification        │
                    └─────────────────────┘

                    ┌─────────────────────┐
                    │      Cardano        │
                    │ Smart Contracts     │
                    │ Wallets / ADA       │
                    └─────────────────────┘
```

---

# 🖥️ Frontend

### Technology

* **Next.js 16**
* **React 19**
* **TypeScript**
* **Tailwind CSS v4**
* **Framer Motion**
* **Lucide Icons**
* **Zustand**
* **Axios**

### Location

```text
/
```

### Responsibilities

The frontend provides:

* Landing page
* Client dashboard
* Freelancer dashboard
* Project creation
* Project management
* Escrow interface
* Submission interface
* Wallet integration interface
* Responsive UI
* Authentication state management

---

# ⚙️ Backend

### Technology

* **Node.js**
* **Express.js**
* **TypeScript**
* **Prisma ORM**
* **PostgreSQL**
* **Supabase**
* **Zod**
* **JWT**
* **Helmet**
* **CORS**
* **Rate Limiting**

### Location

```text
/backend
```

### Responsibilities

The backend handles:

* Authentication
* User management
* Project management
* Escrow records
* Submission management
* Database operations
* Input validation
* Authorization
* API security

---

# 🗄️ Database Architecture

EscrowAI uses **PostgreSQL with Prisma ORM**.

### Core entities

```text
User
 │
 ├── Projects
 │
 └── Submissions

Project
 │
 ├── Escrow
 │
 ├── Submissions
 │
 └── Transactions
```

### Main tables

| Entity        | Purpose                                     |
| ------------- | ------------------------------------------- |
| `User`        | Stores client and freelancer identities     |
| `Project`     | Stores freelance project information        |
| `Escrow`      | Tracks escrow state and payment information |
| `Submission`  | Stores freelancer deliverables              |
| `Transaction` | Tracks blockchain transaction information   |

---

# 🔐 Authentication

EscrowAI uses wallet-oriented authentication combined with JWT authorization.

The intended authentication flow is:

```text
Connect Wallet
      ↓
Wallet Address
      ↓
Nonce
      ↓
Wallet Signature
      ↓
Backend Verification
      ↓
JWT Token
      ↓
Authenticated Session
```

Protected API requests use:

```text
Authorization: Bearer <JWT>
```

Private wallet keys are not intended to be stored on the backend.

---

# 👥 User Roles

The platform is designed around two primary roles.

## Client

Clients can:

* Create projects
* Define project requirements
* Set budgets
* Create escrow records
* Manage projects
* Review submissions

## Freelancer

Freelancers can:

* View assigned projects
* Access project requirements
* Submit deliverables
* Track submission status

---

# 💰 Escrow Model

The current application provides the database and API foundation for escrow management.

Typical escrow states include:

```text
CREATED
   ↓
FUNDED
   ↓
LOCKED
   ↓
RELEASED
```

The application separates the **escrow record/state** from the eventual blockchain settlement layer.

This distinction is important:

> A database escrow status does not by itself prove that ADA has moved on-chain.

Blockchain transaction confirmation should be verified independently once the Cardano settlement layer is enabled.

---

# 🤖 AI Integration Roadmap

Gemini AI is planned as an intelligent verification layer for freelancer submissions.

The intended workflow is:

```text
Project Requirements
        +
Freelancer Deliverable
        ↓
     Gemini AI
        ↓
Verification Report
        ↓
PASS / REVISION / FAIL
```

Potential AI capabilities include:

* Requirement matching
* Deliverable analysis
* Submission scoring
* Missing requirement detection
* Risk assessment
* Improvement suggestions

AI should assist verification rather than independently control financial settlement.

---

# ⛓️ Cardano Integration Roadmap

Cardano is the planned decentralized settlement layer for EscrowAI.

The target workflow is:

```text
Client Wallet
     ↓
Escrow Smart Contract
     ↓
ADA Locked
     ↓
Freelancer Completes Work
     ↓
Approval Conditions
     ↓
Release Transaction
     ↓
Freelancer Wallet
```

Planned Cardano components include:

* Cardano wallets
* CIP-30 wallet integration
* Aiken smart contracts
* Plutus V3
* Mesh SDK
* Lucid
* Blockfrost
* Preview Testnet

---

# 📄 API Endpoints

## Users

```text
POST /api/users
```

Create a wallet-based user.

```text
GET /api/users/wallet/:walletAddress
```

Retrieve a user by wallet address.

```text
GET /api/users/me
```

Retrieve the authenticated user.

---

## Projects

```text
POST /api/projects
```

Create a project.

```text
GET /api/projects
```

List projects.

```text
GET /api/projects/:id
```

Retrieve project details.

```text
PUT /api/projects/:id
```

Update a project.

---

## Escrow

```text
POST /api/escrow/create
```

Create an escrow record.

```text
GET /api/escrow/:projectId
```

Retrieve escrow information.

```text
PUT /api/escrow/:projectId/status
```

Update escrow status.

---

## Submissions

```text
POST /api/submissions
```

Submit freelancer work.

```text
GET /api/submissions/:projectId
```

Retrieve project submissions.

---

## Transactions

```text
POST /api/transactions
```

Record a blockchain transaction.

```text
GET /api/transactions/:projectId
```

Retrieve project transaction history.

---

# 🗺️ Frontend Routes

| Route                    | Description                     |
| ------------------------ | ------------------------------- |
| `/`                      | Landing page                    |
| `/dashboard`             | Main dashboard                  |
| `/client/create`         | Create project                  |
| `/client/projects`       | Client project management       |
| `/freelancer/projects`   | Freelancer projects             |
| `/freelancer/submission` | Freelancer submission workspace |
| `/dashboard/wallet`      | Wallet management               |
| `/freelancer/profile`    | Freelancer profile              |

---

# 🔌 Frontend Services

The frontend uses a service-oriented API architecture.

```text
src/services/
```

Important services include:

| Service                | Responsibility                         |
| ---------------------- | -------------------------------------- |
| `api.ts`               | Axios configuration and authentication |
| `userService.ts`       | User operations                        |
| `projectService.ts`    | Project operations                     |
| `escrowService.ts`     | Escrow operations                      |
| `milestoneService.ts`  | Milestone operations                   |
| `reputationService.ts` | Reputation operations                  |
| `aiService.ts`         | AI verification communication          |

---

# 🧪 Development

## Prerequisites

Install:

* Node.js 18+
* npm
* Git
* PostgreSQL / Supabase

For future blockchain testing:

* Cardano wallet
* Cardano Preview Testnet access
* Blockfrost account
* Test ADA

---

# 📥 Installation

Clone the repository:

```bash
git clone https://github.com/Sharan3939/Escrow-AI.git
cd Escrow-AI
```

---

## Frontend Setup

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Backend Setup

Open another terminal:

```bash
cd backend
npm install
npm run build
npm run dev
```

Backend:

```text
http://localhost:3001
```

Health check:

```text
http://localhost:3001/health
```

---

# 🔑 Environment Variables

## Frontend

Create:

```text
.env.local
```

Example:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=EscrowAI
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_CHAIN=cardano
```

## Backend

Create:

```text
backend/.env
```

Example:

```env
PORT=3001
NODE_ENV=development

DATABASE_URL=your_supabase_database_url

JWT_SECRET=your_secure_jwt_secret

GEMINI_API_KEY=your_gemini_api_key

BLOCKFROST_PROJECT_ID=your_blockfrost_preview_project_id

CARDANO_NETWORK=preview
```

**Never commit `.env`, `.env.local`, API keys, database passwords, JWT secrets, or wallet secrets to GitHub.**

---

# 🛠️ Development Commands

## Frontend

```bash
npm run dev
```

Start development server.

```bash
npm run build
```

Create production build.

```bash
npm run lint
```

Run ESLint.

```bash
npx tsc --noEmit
```

Run TypeScript validation.

---

## Backend

```bash
npm run dev
```

Start backend development server.

```bash
npm run build
```

Compile TypeScript.

```bash
npm run lint
```

Run ESLint.

```bash
npx prisma generate
```

Generate Prisma client.

```bash
npx prisma db push
```

Synchronize the Prisma schema with the development database.

---

# 🔒 Security

EscrowAI includes several application-level security measures:

* JWT authentication
* Bearer-token authorization
* Wallet-based identity
* Zod input validation
* Helmet security headers
* CORS configuration
* API rate limiting
* Protected routes
* Role-aware operations
* Prisma type-safe database access

For blockchain operations, transaction signing is intended to occur through the user's wallet rather than exposing private keys to the application backend.

---

# 📊 Project Status

## Phase 1 — Frontend Foundation

**Status: ✅ Ready**

Completed:

* [x] Next.js application
* [x] App Router
* [x] Responsive UI
* [x] Tailwind CSS
* [x] Dashboard
* [x] Client workspace
* [x] Freelancer workspace
* [x] Project creation interface
* [x] Project management interface
* [x] Component architecture
* [x] Zustand state management
* [x] Axios service layer

---

## Phase 2 — Backend & Database

**Status: ✅ Ready**

Completed:

* [x] Express.js backend
* [x] TypeScript
* [x] PostgreSQL
* [x] Supabase integration
* [x] Prisma ORM
* [x] User management
* [x] Project APIs
* [x] Escrow APIs
* [x] Submission APIs
* [x] Transaction records
* [x] JWT authentication
* [x] Zod validation
* [x] Security middleware
* [x] Service/controller architecture

---

## Phase 3 — AI Verification

**Status: 🚧 Integration / Expansion**

Planned capabilities:

* [ ] Gemini-powered submission verification
* [ ] Requirement matching
* [ ] AI scoring
* [ ] Missing requirement detection
* [ ] AI risk analysis
* [ ] Structured verification reports

---

## Phase 4 — Cardano Settlement

**Status: 🚧 Integration / Expansion**

Planned capabilities:

* [ ] Cardano wallet integration
* [ ] Preview Testnet transactions
* [ ] Aiken smart contract
* [ ] ADA escrow locking
* [ ] Release transactions
* [ ] Transaction confirmation
* [ ] On-chain transaction verification

---

## Phase 5 — Advanced Escrow

**Status: 🔮 Planned / Expanding**

Potential features:

* [ ] Dual approval
* [ ] Milestone escrow
* [ ] Revision workflow
* [ ] Dispute resolution
* [ ] Freelancer reputation
* [ ] Client reviews
* [ ] On-chain reputation
* [ ] Advanced fraud detection
* [ ] Project analytics

---

# 🧪 Quality & Validation

The project follows a type-safe development approach.

### Code Quality

* TypeScript
* ESLint
* Zod validation
* Prisma type safety
* Modular service architecture
* Controller/service separation
* Environment-based configuration

### Validation

Before submitting changes:

```bash
npm run build
```

and:

```bash
npx tsc --noEmit
```

should complete successfully for the relevant application layer.

---

# 🔮 Future Vision

The long-term vision of EscrowAI is to create a decentralized freelance infrastructure where:

```text
      AI
      │
      ▼
Requirement Verification
      │
      ▼
   Freelance Work
      │
      ▼
Client + AI Approval
      │
      ▼
Cardano Smart Contract
      │
      ▼
Transparent Settlement
```

Future versions can extend this foundation with:

* Multi-milestone escrow
* Decentralized dispute resolution
* On-chain reputation
* AI fraud detection
* Freelancer discovery
* Project matching
* Portfolio verification
* Real-time communication
* Notification systems
* Analytics
* Mainnet deployment

---

# 📁 Project Structure

```text
Escrow-AI/
│
├── app/
│   ├── client/
│   ├── freelancer/
│   ├── dashboard/
│   └── projects/
│
├── src/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   └── utils/
│
├── backend/
│   ├── prisma/
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── services/
│       ├── validators/
│       ├── workers/
│       └── tests/
│
├── public/
│
├── package.json
└── README.md
```

---

# 🌐 Repository

**GitHub**

https://github.com/Sharan3939/Escrow-AI

---

# 👨‍💻 Author

## Sharan Raju Cheduluri

**Data Science Student | Full-Stack Developer | AI & Web3 Enthusiast**

GitHub:
https://github.com/Sharan3939

LinkedIn:
https://www.linkedin.com/in/sharan-raju-chedhuluri/

---

# 📜 License

This project is licensed under the **MIT License**.

See the `LICENSE` file for details.

---

<p align="center">
  <strong>EscrowAI</strong><br>
  AI + Blockchain + Smart Escrow for the Future of Freelance Payments
</p>
