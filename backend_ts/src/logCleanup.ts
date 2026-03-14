import fs from "fs";
import path from "path";

/** Number of days to retain log files before deletion */
const LOG_RETENTION_DAYS = 14;

/**
 * Cleans up old log files from the specified directory
 * Removes files older than LOG_RETENTION_DAYS
 * @param {string} logDir - Path to the log directory to clean
 */
export function cleanupLogs(logDir: string) {
    if (!fs.existsSync(logDir)) return;

    const files = fs.readdirSync(logDir);
    const now = Date.now();

    for (const file of files) {
        const fullPath = path.join(logDir, file);
        const stat = fs.statSync(fullPath);

        if (!stat.isFile()) continue;

        const ageDays =
            (now - stat.mtime.getTime()) / (1000 * 60 * 60 * 24);

        if (ageDays > LOG_RETENTION_DAYS) {
            fs.unlinkSync(fullPath);
        }
    }
}
