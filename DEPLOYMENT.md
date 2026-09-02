# Deployment Guide

EscrowAI is designed to be deployed with a separated Frontend (Vercel) and Backend (Render). 

## 1. Frontend (Next.js) -> Vercel

1. Connect your GitHub repository to Vercel.
2. Select the root directory (or `./` depending on setup).
3. Set the following environment variables:
   - `NEXT_PUBLIC_API_URL`: Your deployed backend URL.
4. Deploy.

## 2. Backend (Express) -> Render

1. Create a new Web Service on Render, connected to your GitHub repository.
2. Set the Root Directory to `backend/`.
3. Build Command: `npm install && npm run build`.
4. Start Command: `npm start` (or `node dist/index.js`).
5. Set Environment Variables:
   - `PORT`: (Render sets this, usually 10000)
   - `DATABASE_URL`: Supabase connection string.
   - `DIRECT_URL`: Supabase direct connection string.
   - `JWT_SECRET`: A secure random string.
   - `GEMINI_API_KEY`: Your Google Gemini AI API key.
   - `GEMINI_MODEL`: (e.g. `gemini-1.5-pro`)
   - `FRONTEND_URL`: Your Vercel domain.

## 3. Database (Supabase)

The production database is hosted on Supabase.
1. Create a new Supabase project.
2. Under "Database settings", copy the connection string.
3. Replace the placeholder in `.env.production`.
4. Run `npx prisma db push` (or `migrate deploy`) against the production DB.

## 4. Blockchain (Cardano)

We use the Preview Testnet. No backend deployment is needed for the blockchain, but users must have a Cardano wallet (Eternl, Nami) switched to the Preview Testnet to interact with EscrowAI.
