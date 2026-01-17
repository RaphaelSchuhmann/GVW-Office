/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { dbService } from "./db.service";
import { cleanupLogs } from "./logCleanup";
import { logger } from "./logger";

/**
 * Bootstraps the application by initializing services and starting the server
 * Performs log cleanup, database initialization, and starts the Express server
 */
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
