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

// Functionality wise the members controller and events controller have generally the same endpoints.
// eventsRouter.post("/delete", async (req, resp) => {
//     try {
//         const { id } = req.body;
//
//         if (!id) return resp.status(400).json({ errorMessage: "InvalidInputs" });
//
//         const member = await dbService.read("members", id);
//         const users = await dbService.find("users", { selector: { memberId: id }, limit: 1 });
//
//         const user = users[0];
//
//         if (!member) return resp.status(404).json({ errorMessage: "MemberNotFound" });
//         if (!user) return resp.status(404).json({ errorMessage: "UserNotFound" });
//
//         await dbService.delete("members", member._id, member._rev);
//         await dbService.delete("users", user._id, user._rev);
//
//         return resp.status(200).json({ ok: true });
//     } catch (err: any) {
//         logger.error({ err }, "members/delete route errorMessage: ");
//         return resp.status(500).json({ errorMessage: "InternalServerError" });
//     }
// });
//
// eventsRouter.post("/update", async (req, resp) => {
//     try {
//         const { id, name, surname, email, phone, address, voice, status, role, birthdate, joined } = req.body;
//         if (!validInputs(name, surname, email, phone, address, voice, status, role, birthdate, joined) || !id) {
//             return resp.status(400).json({ errorMessage: "InvalidInputs" });
//         }
//
//         const member = await dbService.read("members", id);
//         if (!member) return resp.status(404).json({ errorMessage: "MemberNotFound" });
//
//         const users = await dbService.find("users", { selector: { memberId: id }, limit: 1 });
//
//         const user = users[0];
//         if (!user) return resp.status(404).json({ errorMessage: "UserNotFound" });
//
//         await dbService.update("members", {
//             ...member,
//             name,
//             surname,
//             email,
//             phone,
//             address,
//             voice,
//             status,
//             role,
//             birthdate,
//             joined
//         });
//
//         await dbService.update("users", {
//             ...user,
//             name: `${name} ${surname}`,
//             email,
//             phone,
//             address,
//             role,
//             memberId: id
//         });
//
//         return resp.status(200).json({ ok: true });
//     } catch (err: any) {
//         logger.error({ err }, "members/update route errorMessage");
//         return resp.status(500).json({ errorMessage: "InternalServerError" });
//     }
// });
//
// eventsRouter.post("/update/status", async (req, resp) => {
//     try {
//         const { id } = req.body;
//         if (!id) return resp.status(400).json({ errorMessage: "InvalidInputs" });
//
//         const member = await dbService.read("members", id);
//         if (!member) return resp.status(404).json({ errorMessage: "MemberNotFound" });
//
//         if (member.status === "active") {
//             await dbService.update("members", { ...member, status: "inactive" });
//         } else {
//             await dbService.update("members", { ...member, status: "active" });
//         }
//
//         return resp.status(200).json({ ok: true });
//     } catch (err: any) {
//         logger.error({ err }, "members/update/status route errorMessage");
//         return resp.status(500).json({ errorMessage: "InternalServerError" });
//     }
// });
//
// function validInputs(name: string, surname: string, email: string, phone: string, address: string, voice: string, status: string, role: string, birthdate: string, joined: number) {
//     if (!name || !surname || !email || !phone || !address || !voice || !status || !role || !birthdate || !joined || name.trim() === "" || surname.trim() === "") {
//         return false;
//     }
//
//     if (!validStatus.includes(status)) return false;
//     if (!validRole.includes(role)) return false;
//     if (!validVoice.includes(voice)) return false;
//     return !(joined < minJoined || joined > maxJoined);
// }

export { eventsRouter };