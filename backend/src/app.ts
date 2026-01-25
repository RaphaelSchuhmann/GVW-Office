import express from "express";
import cors from "cors";
import authMiddleware from './middlewares/authMiddleware';
import { logger } from "./logger";
import pinoHttp from "pino-http";

import healthRoutes from './routes/healthController';
import { authRouter } from './routes/authenticationController';
import appSettingsRouter from "./routes/appSettingsController";
import userRouter from "./routes/userController";
import membersRouter from "./routes/membersController";
import emergencyRouter from "./routes/emergencyController";
import eventsRouter from "./routes/eventsController";
import reportsRouter from "./routes/reportsController";
import libraryRouter from "./routes/libraryController";

const app = express();

app.use(cors());
app.use(express.json());

app.use(pinoHttp({ logger, autoLogging: true }));

app.use('/health', healthRoutes);
app.use('/auth', authRouter);
app.use('/emergency', emergencyRouter);
app.use('/settings', appSettingsRouter);
app.use('/user', authMiddleware, userRouter);
app.use('/members', authMiddleware, membersRouter);
app.use('/events', authMiddleware, eventsRouter);
app.use('/reports', authMiddleware, reportsRouter);
app.use('/library', authMiddleware, libraryRouter);

export default app;
