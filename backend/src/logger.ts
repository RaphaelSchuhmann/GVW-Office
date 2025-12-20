import pino from "pino";
import fs from "fs";
import path from "path";

const isDev = process.env.NODE_ENV !== "production";

const logDir = path.resolve("./logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

const logFile = path.join(logDir, `app-${timestamp}.log`);

// File destination (JSON, fast)
const fileStream = pino.destination({
    dest: logFile,
    sync: false
});

// Pretty stdout (dev only)
const streams: pino.StreamEntry[] = [
    { stream: fileStream }
];

if (isDev) {
    const pretty = pino.transport({
        target: "pino-pretty",
        options: {
            colorize: true,
            translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
            ignore: "pid,hostname"
        }
    });

    streams.push({ stream: pretty });
}

export const logger = pino(
    {
        level: process.env.LOG_LEVEL || "info",
        redact: {
            paths: [
                "req.headers.authorization",
                "*.password",
                "*.passwordHash",
                "*.token"
            ],
            censor: "***"
        }
    },
    pino.multistream(streams)
);
