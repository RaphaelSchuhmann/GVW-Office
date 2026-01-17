import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";
import authMiddleware from "../middlewares/authMiddleware";

const appSettingsRouter = Router();

/**
 * GET /get
 * Retrieves application settings from the database
 * 
 * Responses:
 * - `200`: Application settings object
 * - `500`: Settings not found or internal server error
 */
appSettingsRouter.get("/get", async (_, resp) => {
    try {
        const settings = await dbService.read("app_settings", "general");

        if (!settings) {
            logger.error("App settings not found");
            return resp.status(500).json({ errorMessage: "InternalServerError" });
        }

        return resp.status(200).json(settings);
    } catch (err: any) {
        logger.error({ err }, "Login route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /update/max-members
 * Updates the maximum members setting in application settings
 * Requires authentication
 * 
 * Request body:
 * - `{ maxMembers: number }`
 * 
 * Headers:
 * - `Authorization: Bearer <token>`
 * 
 * Responses:
 * - `200`: Setting updated successfully
 * - `401`: Invalid or missing authentication token
 * - `500`: Settings not found or internal server error
 */
appSettingsRouter.post("/update/max-members", authMiddleware, async (req, resp) => {
    try {
        const { maxMembers } = req.body;
        const settings = await dbService.read("app_settings", "general");

        if (!settings) {
            logger.error("App settings not found");
            return resp.status(500).json({ errorMessage: "InternalServerError" });
        }

        const updatedDoc = { ...settings, maxMembers: maxMembers };
        await dbService.update("app_settings", updatedDoc);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "Login route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

export { appSettingsRouter };