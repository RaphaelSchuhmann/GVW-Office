import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";

const eventsRouter = Router();

/**
 * GET /all
 * Retrieves all events from the database
 * Automatically updates past events from "upcoming" to "finished" status
 *
 * Responses:
 * - `200`: Array of all events with id field instead of _id
 * - `500`: Internal server error
 */
eventsRouter.get("/all", async (_, resp) => {
    try {
        const events = await dbService.list("events");
        const today = new Date();

        // Update past events to finished status and collect all events
        for (const event of events) {
            const eventDate = parseDMYToDate(event.date);
            
            if (eventDate < today && event.status === "upcoming" && event.mode === "single") {
                await dbService.update("events", { ...event, status: "finished" });
                // Update the event in the array
                event.status = "finished";
            }
        }

        // Map to frontend format (id instead of _id, remove _rev)
        const mappedEvents = events.map(({ _id, _rev, ...event }) => ({ id: _id, ...event }));

        return resp.status(200).json({ data: mappedEvents });
    } catch (err: any) {
        logger.error({ err }, "events/all route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /add
 * Creates a new event in the database
 *
 * Request body:
 * - `{ event: EventObject }`
 *
 * Responses:
 * - `200`: Event created successfully
 * - `400`: Invalid input data
 * - `500`: Internal server error
 */
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

/**
 * POST /delete
 * Deletes an event from the database
 *
 * Request body:
 * - `{ id: string }`
 *
 * Responses:
 * - `200`: Event deleted successfully
 * - `400`: Invalid input data
 * - `404`: Event not found
 * - `500`: Internal server error
 */
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

/**
 * POST /update/status
 * Toggles event status between upcoming and finished
 *
 * Request body:
 * - `{ id: string }`
 *
 * Responses:
 * - `200`: Status updated successfully
 * - `400`: Invalid input data
 * - `404`: Event not found
 * - `500`: Internal server error
 */
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

/**
 * POST /update
 * Updates an existing event with new data
 *
 * Request body:
 * - `{ event: EventObject }`
 *
 * Responses:
 * - `200`: Event updated successfully
 * - `400`: Invalid input data
 * - `404`: Event not found
 * - `500`: Internal server error
 */
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
});

/**
 * Converts DD.MM.YYYY string to JavaScript Date object
 * @param {string} dateStr - Date string in DD.MM.YYYY format
 * @returns {Date} JavaScript Date object
 */
function parseDMYToDate(dateStr: string) {
    const [dayStr, monthStr, yearStr] = dateStr.split(".");
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    return new Date(year, month - 1, day);
}

export { eventsRouter };