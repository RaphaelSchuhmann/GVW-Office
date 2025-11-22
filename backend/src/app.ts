import express from "express";
import cors from "cors";
import healthRoutes from './routes/health';

// Import Routes eg:
// import memeberRoutes from './routes/members';

const app = express();

app.use(cors());
app.use(express.json());

// Add Routes eg:
// app.use('/memebers', memberRoutes);

app.use('/health', healthRoutes);

app.get('/', (_, resp) => {
    resp.send("GVW Office API is running!");
});

export default app;
