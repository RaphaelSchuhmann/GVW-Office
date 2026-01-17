/**
 * Logger configuration and setup using Pino
 * Creates timestamped log files and provides pretty console output in development
 */

import pino from "pino";
import fs from "fs";
import path from "path";

// Determine if running in development mode
const isDev = process.env.NODE_ENV !== "production";

// Create logs directory if it doesn't exist
const logDir = path.resolve("./logs");
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Generate timestamp for log file naming
const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, "-");

const logFile = path.join(logDir, `app-${timestamp}.log`);

// File destination (JSON, fast)
const fileStream = pino.destination({
    dest: logFile,
    sync: false
});

// Configure logging streams
const streams: pino.StreamEntry[] = [
    { stream: fileStream }
];

// Add pretty console output in development
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

/**
 * Configured Pino logger instance with file output and optional pretty console output
 * Automatically redacts sensitive information like passwords and tokens
 */
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
