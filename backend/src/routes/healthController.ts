import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";

const router = Router();

/**
 * GET /
 * Basic health check endpoint
 * 
 * Responses:
 * - `200`: Service is healthy
 */
router.get("/", async (_, resp) => {
    resp.status(200).json({ status: "ok" });
});

/**
 * GET /generateDBs
 * Generates all required databases and initializes default settings
 * Used for initial setup or database reset
 * 
 * Responses:
 * - `200`: Databases generated successfully
 * - `500`: Error during database generation
 */
router.get("/generateDBs", requireLocalhost, async (_, resp) => {
    try {
        await dbService.generateDatabases();

        resp.status(200).json({ status: "ok" });
    } catch (err) {
        logger.error({ err }, "Error generating databases");
        resp.status(500).json({ status: "error", error: err });
    }
});

/**
 * Middleware to restrict access to localhost only
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
function requireLocalhost(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress;
    if (ip !== "127.0.0.1" && ip !== "::1" && ip !== "::ffff:127.0.0.1") {
        return res.status(403).send("Forbidden");
    }
    next();
}

export default router;