import express from "express";
import cors from "cors";
import healthRoutes from './routes/healthController';
import { authRouter } from './routes/authenticationController';
import { userRouter } from "./routes/userController";
import { appSettingsRouter } from "./routes/appSettingsController";
import authMiddleware from './middlewares/authMiddleware';
import { logger } from "./logger";
import pinoHttp from "pino-http";
import { membersRouter } from "./routes/membersController";
import emergencyRouter from "./routes/emergencyController";

const app = express();

app.use(cors());
app.use(express.json());

app.use(pinoHttp({ logger, autoLogging: true }));

app.use('/health', healthRoutes);
app.use('/auth', authRouter);
app.use('/user', authMiddleware, userRouter);
app.use('/settings', appSettingsRouter);
app.use('/members', authMiddleware, membersRouter);
app.use('/emergency', emergencyRouter);

export default app;
