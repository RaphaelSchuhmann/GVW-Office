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

/**
 * POST /update/categories/add
 * Adds a new category to the existing scoreCategories map
 * Requires authentication
 *
 * Request body:
 * - `{ type: string, displayName: string }`
 *
 * Headers:
 * - `Authorization: Bearer <token>`
 *
 * Responses:
 * - `200`: Category added successfully
 * - `400`: Category already exists
 * - `401`: Invalid or missing authentication token
 * - `500`: Settings not found or internal server error
 */
appSettingsRouter.post("/update/categories/add", authMiddleware, async (req, resp) => {
    try {
        const { type, displayName } = req.body;
        const blocked = new Set(["__proto__", "constructor", "prototype"]);
        if (typeof type !== "string" || typeof displayName !== "string" || blocked.has(type) || blocked.has(displayName)) {
            return resp.status(400).json({ errorMessage: "InvalidCategoryKey" });
        }
        let retries = 3;
        
        while (retries > 0) {
            try {
                const settings = await dbService.read("app_settings", "general");

                if (!settings) {
                    logger.error("App settings not found");
                    return resp.status(500).json({ errorMessage: "InternalServerError" });
                }

                const categories = settings.scoreCategories || {};
                if (categories[type] || categories[displayName]) {
                    return resp.status(400).json({ errorMessage: "CategoryAlreadyExists" });
                }

                const updatedDoc = { 
                    ...settings, 
                    scoreCategories: { 
                        ...categories, 
                        [type]: displayName, 
                        [displayName]: type 
                    } 
                };
                await dbService.update("app_settings", updatedDoc);

                return resp.status(200).json({ ok: true });
            } catch (updateErr: any) {
                if (updateErr.status === 409 && retries > 1) {
                    retries--;
                    continue;
                }
                throw updateErr;
            }
        }

        return resp.status(500).json({ errorMessage: "InternalServerError" });
    } catch (err: any) {
        logger.error({ err }, "settings/update/categories/add route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /update/categories/add
 * Removes a category from the existing scoreCategories array
 * Requires authentication
 *
 * Request body:
 * - `{ type: string }`
 *
 * Headers:
 * - `Authorization: Bearer <token>`
 *
 * Responses:
 * - `200`: Category removed successfully / nothing had to be changed
 * - `401`: Invalid or missing authentication token
 * - `500`: Settings not found or internal server error
 */
appSettingsRouter.post("/update/categories/remove", authMiddleware, async (req, resp) => {
    try {
        const { type } = req.body;
        let retries = 3;
        
        while (retries > 0) {
            try {
                const settings = await dbService.read("app_settings", "general");

                if (!settings) {
                    logger.error("App settings not found");
                    return resp.status(500).json({ errorMessage: "InternalServerError" });
                }

                const categories = { ...(settings.scoreCategories || {}) };
                const displayName = categories[type];
                
                delete categories[type];
                if (displayName) delete categories[displayName];

                const updatedDoc = { ...settings, scoreCategories: categories };
                await dbService.update("app_settings", updatedDoc);

                return resp.status(200).json({ ok: true });
            } catch (updateErr: any) {
                if (updateErr.status === 409 && retries > 1) {
                    retries--;
                    continue;
                }
                throw updateErr;
            }
        }

        return resp.status(500).json({ errorMessage: "InternalServerError" });
    } catch (err: any) {
        logger.error({ err }, "settings/update/categories/remove route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

export { appSettingsRouter };