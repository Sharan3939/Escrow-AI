# EscrowAI Backend

Production-quality backend for the decentralized freelance escrow platform.

## Architecture

- **Express.js** — REST API server
- **Prisma** — Database ORM with type safety
- **PostgreSQL** — Data persistence via Supabase
- **TypeScript** — Type-safe implementation
- **Zod** — Request validation
- **JWT** — Authentication

## Database Schema

### Models

- **User** — Client and freelancer profiles
- **Project** — Freelance projects
- **Escrow** — Payment escrow tracking
- **Submission** — Work submissions with AI scoring
- **Transaction** — Cardano blockchain transactions

## API Routes

### Users
- `POST /api/users` — Create wallet-based user
- `GET /api/users/wallet/:walletAddress` — Get user by wallet
- `GET /api/users/me` — Get authenticated user

### Projects
- `POST /api/projects` — Create project
- `GET /api/projects` — List all projects
- `GET /api/projects/:id` — Get project details
- `PUT /api/projects/:id` — Update project

### Escrow
- `POST /api/escrow/create` — Create escrow
- `GET /api/escrow/:projectId` — Get escrow details
- `PUT /api/escrow/:projectId/status` — Update status

### Submissions
- `POST /api/submissions` — Submit work
- `GET /api/submissions/:projectId` — Get submission

### Transactions
- `POST /api/transactions` — Record blockchain tx
- `GET /api/transactions/:projectId` — Get transaction history

## Setup

```bash
cd backend
npm install
cp .env.example .env
npm run prisma:push
npm run dev
```

## Environment Variables

```
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_KEY=...
JWT_SECRET=min-32-chars...
PORT=3001
NODE_ENV=development
```

## Development

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript
npm run prisma:push  # Sync database schema
```

## Production

```bash
npm run build
npm start
```
