import express from "express";
import cors from "cors";
import healthRoutes from './routes/health';
import { authRouter } from './routes/authentication';
import authMiddleware from './middlewares/authMiddleware';

// Import Routes eg:
// import memeberRoutes from './routes/members';

const app = express();

app.use(cors());
app.use(express.json());

// Add Routes eg:
// app.use('/memebers', memberRoutes);

app.use('/health', healthRoutes);
app.use('/auth', authRouter);

export default app;
