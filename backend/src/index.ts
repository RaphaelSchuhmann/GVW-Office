/// <reference path="./types/express.d.ts" />
import dotenv from "dotenv";
import app from "./app";
dotenv.config();

async function bootstrap() {
    app.listen(process.env.PORT, () => {
        console.log(`API running on port ${process.env.PORT}`);
    });
}

bootstrap();
