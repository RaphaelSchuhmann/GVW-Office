import express from "express";
import cors from "cors";
import healthRoutes from './routes/health';
import { authRouter } from './routes/authentication';
import { userRouter } from "./routes/userController";
import { appSettingsRouter } from "./routes/appSettingsController";
import authMiddleware from './middlewares/authMiddleware';
import { logger } from "./logger";
import pinoHttp from "pino-http";

const app = express();

app.use(cors());
app.use(express.json());

app.use(pinoHttp({ logger, autoLogging: true }));

app.use('/health', healthRoutes);
app.use('/auth', authRouter);
app.use('/user', authMiddleware, userRouter);
app.use('/settings', authMiddleware, appSettingsRouter);

export default app;
