import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { config } from "./config/index.js";
import { errorHandler, responseFormatter } from "./middleware/errors.js";
import usersRouter from "./routes/users.js";
import projectsRouter from "./routes/projects.js";
import escrowRouter from "./routes/escrow.js";
import submissionsRouter from "./routes/submissions.js";
import transactionsRouter from "./routes/transactions.js";
import aiRouter from "./routes/ai.routes.js";
import cardanoRouter from "./routes/cardano.routes.js";
import authRouter from "./routes/auth.routes.js";
import milestonesRouter from "./routes/milestones.js";
import reputationRouter from "./routes/reputation.js";
import { startBlockchainListener } from "./workers/blockchainListener.js";

const app = express();

app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(responseFormatter);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use("/api/", limiter);

app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/milestones", milestonesRouter);
app.use("/api/reputation", reputationRouter);
app.use("/api/escrow", escrowRouter);
app.use("/api/submissions", submissionsRouter);
app.use("/api/transactions", transactionsRouter);
app.use("/api/ai", aiRouter);
app.use("/api/cardano", cardanoRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const server = app.listen(config.port, () => {
  console.log(`🚀 Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  startBlockchainListener();
});

export default server;
