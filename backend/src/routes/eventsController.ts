import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";

const eventsRouter = Router();

eventsRouter.get("/all", async (_, resp) => {
    try {
        const events = (await dbService.list("events")).map(({ _id, _rev, ...event }) => ({ id: _id, ...event }));

        return resp.status(200).json({ data: events });
    } catch (err: any) {
        logger.error({ err }, "events/all route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

eventsRouter.post("/add", async (req, resp) => {
    try {
        const { event } = req.body;

        if (!event) {
            return resp.status(400).json({ errorMessage: "InvalidInputs" });
        }

        await dbService.create("events", event);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "events/add route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

eventsRouter.post("/delete", async (req, resp) => {
    try {
        const { id } = req.body;

        if (!id) return resp.status(400).json({ errorMessage: "InvalidInputs" });

        const event = await dbService.read("events", id);
        if (!event) return resp.status(404).json({ errorMessage: "EventNotFound" });

        await dbService.delete("events", event._id, event._rev);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "events/delete route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

eventsRouter.post("/update/status", async (req, resp) => {
    try {
        const { id } = req.body;
        if (!id) return resp.status(400).json({ errorMessage: "InvalidInputs" });

        const event = await dbService.read("events", id);
        if (!event) return resp.status(404).json({ errorMessage: "EventNotFound" });

        if (event.status === "upcoming") {
            await dbService.update("events", { ...event, status: "finished" });
        } else {
            await dbService.update("events", { ...event, status: "upcoming" });
        }

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "events/update/status route errorMessage");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

eventsRouter.post("/update", async (req, resp) => {
    try {
        const { event } = req.body;

        if (!event) {
            return resp.status(400).json({ errorMessage: "InvalidInputs" });
        }

        const events = await dbService.find("events", { selector: { _id: event.id }, limit: 1 });
        const storedEvent = events[0];
        if (!storedEvent) return resp.status(404).json({ errorMessage: "EventNotFound" });

        await dbService.update("events", { ...storedEvent, ...event });

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "events/update route errorMessage");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
})

export { eventsRouter };