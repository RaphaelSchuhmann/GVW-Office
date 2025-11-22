import dotenv from "dotenv";
import app from "./app";
import { findFreePort } from "./port-server";

async function bootstrap() {
    const { port, host } = await findFreePort({
        portStart: 3500,
        portEnd: 3600,
    });

    app.listen(port, host, () => {
        console.log(`API running on port ${port}`);
    });
}

bootstrap();
