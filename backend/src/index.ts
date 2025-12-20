/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
import app from "./app";
import { dbService } from "./db.service";
import { cleanupLogs } from "./logCleanup";
import { logger } from "./logger";
dotenv.config();

async function bootstrap() {
    cleanupLogs("../logs");
    logger.info("API started");

    // Check if db connection is established
    await dbService.init();

    app.listen(process.env.PORT, () => {
        console.log(`API running on port ${process.env.PORT}`);
    });
}

bootstrap().then();
