import { Router } from "express";
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
router.get("/generateDBs", async (_, resp) => {
    try {
        await dbService.generateDatabases();

        resp.status(200).json({ status: "ok" });
    } catch (err) {
        logger.error({ err }, "Error generating databases");
        resp.status(500).json({ status: "error", error: err });
    }
});

/**
 * GET /generateEventData
 * Clears existing events and creates sample event data for testing
 * Creates various types of events (single, weekly, monthly) for development
 * 
 * Responses:
 * - `200`: Event data generated successfully
 * - `500`: Error during event data generation
 */
router.get("/generateEventData", async (_, resp) => {
    try {
        const events = await dbService.list("events");

        for (const event of events) {
            await dbService.delete("events", event._id, event._rev);
        }

        await dbService.create("events", {
            title: "Sommerkonzert",
            type: "concert",
            status: "upcoming",
            date: "20.06.2026",
            time: "18:00",
            location: "Stadthalle",
            description: "Keine Beschreibung",
            mode: "single"
        });

        await dbService.create("events", {
            title: "Wochenprobe",
            type: "practice",
            status: "upcoming",
            date: "16.01.2026",
            time: "20:00",
            location: "Gasthof XYZ",
            description: "Eine Wöchentliche Chor Probe",
            mode: "weekly"
        });

        await dbService.create("events", {
            title: "Monatsprobe - Gemischter Chor",
            type: "practice",
            status: "upcoming",
            date: "07.02.2026",
            time: "13:00",
            location: "Gasthof XYZ",
            description: "Eine Monatliche Chor Probe für den Gemischen Chor",
            mode: "monthly",
            recurrence: {
                monthlyKind: "weekday",
                weekDay: 6,
                ordinal: 1
            }
        });

        await dbService.create("events", {
            title: "Vorstandssitzung",
            type: "meeting",
            status: "upcoming",
            date: "15.03.2026",
            time: "20:00",
            location: "Gasthof XYZ",
            description: "Keine Beschreibung",
            mode: "monthly",
            recurrence: {
                monthlyKind: "date",
                dayOfMonth: 15
            }
        });

        resp.status(200).json({ status: "ok" });
    } catch (err) {
        logger.error({ err }, "Error generating event data");
        resp.status(500).json({ status: "error", error: err });
    }
});

export default router;