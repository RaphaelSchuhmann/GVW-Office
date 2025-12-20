/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
import app from "./app";
import { dbService } from "./db.service";
dotenv.config();

async function bootstrap() {
    // Check if db connection is established
    await dbService.init();

    app.listen(process.env.PORT, () => {
        console.log(`API running on port ${process.env.PORT}`);
    });
}

bootstrap().then();
