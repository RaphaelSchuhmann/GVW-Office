import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";

const router = Router();

router.get("/", async (_, resp) => {
    resp.status(200).json({ status: "ok" });
});

router.get("/generateDBs", async (_, resp) => {
    try {
        await dbService.generateDatabases();

        resp.status(200).json({ status: "ok" });
    } catch (err) {
        logger.error({ err }, "Error generating databases");
        resp.status(500).json({ status: "error", error: err });
    }
});

router.get("/generateEventData", async (_, resp) => {
    try {
        await dbService.create("events", {
            title: "Jahreshauptversammlung",
            type: "meeting",
            status: "upcoming",
            when: "20.11.2025",
            time: "18:00",
            location: "Gasthof XYZ",
            description: "Keine Beschreibung"
        });
        await dbService.create("events", {
            title: "Jahreshauptversammlung2",
            type: "meeting",
            status: "upcoming",
            when: "20.11.2025",
            time: "18:00",
            location: "Gasthof XYZ",
            description: "Keine Beschreibung"
        });
        await dbService.create("events", {
            title: "Jahreshauptversammlung3",
            type: "meeting",
            status: "upcoming",
            when: "20.11.2025",
            time: "18:00",
            location: "Gasthof XYZ",
            description: "Keine Beschreibung"
        });
        await dbService.create("events", {
            title: "Jahreshauptversammlung4",
            type: "meeting",
            status: "finished",
            when: "20.11.2025",
            time: "18:00",
            location: "Gasthof XYZ",
            description: "Keine Beschreibung"
        });

        resp.status(200).json({ status: "ok" });
    } catch (err) {
        logger.error({ err }, "Error generating event data");
        resp.status(500).json({ status: "error", error: err });
    }
});

export default router;