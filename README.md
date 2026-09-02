# EscrowAI - AI Powered Smart Escrow for Freelancers on Cardano

Production-quality full-stack Web3 application for decentralized freelance escrow.

## Project Architecture

### Frontend (Next.js)
- Location: `/`
- Framework: Next.js 16 with App Router
- Styling: TailwindCSS v4 + Glassmorphism
- UI Framework: Framer Motion, Lucide Icons
- State: Zustand
- API Client: Axios

### Backend (Express.js)
- Location: `/backend`
- Framework: Express.js with TypeScript
- Database: PostgreSQL (Supabase)
- ORM: Prisma with full type safety
- Validation: Zod
- Security: Helmet, CORS, Rate Limiting

## Setup Instructions

### Frontend

```bash
cd .
npm install
npm run dev
# Open http://localhost:3000
```

### Backend

```bash
cd backend
npm install
cp .env.example .env
npm run build
npm run dev
# Server runs on http://localhost:3001
```

### Environment Variables

**Frontend** (`.env`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=EscrowAI
NEXT_PUBLIC_CHAIN=cardano
```

**Backend** (`backend/.env`):
```
DATABASE_URL=postgresql://user:password@localhost:5432/escrow_ai
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET=min-32-characters
PORT=3001
NODE_ENV=development
```

## Database Schema

**Tables:**
- `User` — Clients and freelancers (CLIENT, FREELANCER roles)
- `Project` — Freelance projects (OPEN, ASSIGNED, SUBMITTED, APPROVED, COMPLETED)
- `Escrow` — Payment escrow tracking (CREATED, FUNDED, LOCKED, RELEASED)
- `Submission` — Work deliverables with AI scoring
- `Transaction` — Cardano blockchain transaction records

**Relations:**
- User → Projects (one-to-many)
- Project → Escrow (one-to-one)
- Project → Submissions (one-to-many)
- Project → Transactions (one-to-many)

## API Endpoints

### Users
- `POST /api/users` — Create wallet-based user + JWT token
- `GET /api/users/wallet/:walletAddress` — Get user by wallet
- `GET /api/users/me` — Get authenticated user (requires Bearer token)

### Projects
- `POST /api/projects` — Create project (requires auth)
- `GET /api/projects` — List all projects
- `GET /api/projects/:id` — Get project details
- `PUT /api/projects/:id` — Update project (requires auth)

### Escrow
- `POST /api/escrow/create` — Create escrow record
- `GET /api/escrow/:projectId` — Get escrow details
- `PUT /api/escrow/:projectId/status` — Update escrow status

### Submissions
- `POST /api/submissions` — Submit work (requires auth)
- `GET /api/submissions/:projectId` — Get submission details

### Transactions
- `POST /api/transactions` — Record blockchain transaction
- `GET /api/transactions/:projectId` — Get transaction history

## Frontend Pages

- `/` — Landing page with hero, features, roadmap
- `/dashboard` — Operations hub (stats, escrows, transactions, AI reports)
- `/client/create` — Create new escrow project
- `/client/projects` — Manage client projects
- `/freelancer/projects` — View assigned escrows
- `/freelancer/submission` — Upload and submit work

## Frontend Services

All frontend API communication goes through type-safe service layer:

- `src/services/api.ts` — Axios client with auth + error handling
- `src/services/userService.ts` — User management
- `src/services/projectService.ts` — Project CRUD
- `src/services/escrowService.ts` — Escrow + submissions + transactions

## Development Commands

### Frontend
```bash
npm run dev        # Start dev server (port 3000)
npm run build      # Build for production
npm run lint       # Check ESLint
```

### Backend
```bash
npm run dev        # Start dev server with hot reload (port 3001)
npm run build      # Compile TypeScript
npm run lint       # Check ESLint
npm run prisma:generate  # Generate Prisma types
npm run prisma:push      # Sync database schema
```

## Code Quality

- **TypeScript** — Strict mode, full type coverage
- **ESLint** — Clean code standards
- **Zod** — Runtime validation
- **Prisma** — Type-safe database access
- **No TODO comments** — All code is production-ready
- **No code duplication** — DRY principles throughout

## Security Features

- JWT authentication with Bearer tokens
- Rate limiting (100 requests per 15 minutes)
- Helmet.js for security headers
- CORS configured for frontend origins
- Input validation with Zod
- Secure password handling with bcrypt

## Next Steps - Phase 3

1. **Gemini AI Integration**
   - AI-powered submission scoring
   - Automated deliverable verification
   - Risk assessment reports

2. **Cardano Integration**
   - Smart contract escrow creation
   - ADA payment processing
   - Blockchain transaction recording
   - Mesh SDK integration

3. **Advanced Features**
   - Dispute resolution
   - Reputation system
   - Multi-milestone projects
   - Payment milestones
   - Freelancer portfolios

## Phase 4: Cardano Integration Setup

To test the Cardano Wallet integration on the Preview Testnet:

1. **Wallet Setup**: Install a Cardano wallet browser extension (e.g., Nami, Eternl, or Lace).
2. **Network Config**: Ensure your wallet is set to the **Preview Testnet** network.
3. **Fund Wallet**: Use the official Cardano Testnet Faucet to receive tADA.
4. **Blockfrost Config**: Create an account on Blockfrost, generate a Preview project ID, and add it to `backend/.env` as `BLOCKFROST_PROJECT_ID`.

### Transaction Flow
- **Connect Wallet**: Handled via Mesh SDK's `@meshsdk/react`.
- **Sign Tx**: Users sign locking and release transactions directly in the browser (private keys never touch the backend).
- **Backend Verification**: The backend securely validates the transaction hash with Blockfrost.

## Project Status

✅ Phase 1: Frontend architecture and UI system  
✅ Phase 2: Backend API, database, and service layer  
✅ Phase 3: Gemini AI Integration  
✅ Phase 4: Cardano Wallet Integration (Preview Testnet)

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, TailwindCSS |
| Backend | Express.js, TypeScript, Node.js |
| Database | PostgreSQL (Supabase), Prisma ORM |
| Authentication | JWT, Bearer tokens |
| Validation | Zod |
| State | Zustand |
| API Client | Axios |
| Security | Helmet, CORS, Rate Limiting |
| Animations | Framer Motion |
| Icons | Lucide, React Icons |

---

**License:** MIT  
**Year:** 2026  
**Status:** Production Ready (Phase 1-2)
