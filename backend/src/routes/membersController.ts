import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";
import { hash } from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { generateTempPassword } from "./authenticationController";

const membersRouter = Router();

const validStatus = ["active", "inactive"];
const validRole = ["member", "admin", "schriftführer", "vorstand"];
const validVoice = ["tenor1", "tenor2", "bass1", "bass2"];
const minJoined = 1924;
const maxJoined = new Date().getFullYear() + 1;

membersRouter.get("/all", async (_, resp) => {
    try {
        const members = (await dbService.list("members")).map(({ _id, _rev, ...member }) => ({ id: _id, ...member }));

        return resp.status(200).json({ members: members });
    } catch (err: any) {
        logger.error({ err }, "members/all route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

membersRouter.post("/add", async (req, resp) => {
    // TODO: Send email with temporary password to given email

    let memberId: string | null = null;
    let memberRev: string | null = null;

    try {
        const { name, surname, email, phone, address, voice, status, role, birthdate, joined } = req.body;

        // Validate inputs
        if (!validInputs(name, surname, email, phone, address, voice, status, role, birthdate, joined))
            return resp.status(400).json({ errorMessage: "InvalidInputs" });

        let tempPassword = await generateTempPassword();

        // Create new member
        const member = await dbService.create("members", {
            name: name,
            surname: surname,
            email: email,
            phone: phone,
            address: address,
            voice: voice,
            status: status,
            role: role,
            birthdate: birthdate,
            joined: joined
        });

        memberId = member.id;
        memberRev = member.rev;

        // Add actual user account
        await dbService.create("users", {
            email: email,
            name: `${name} ${surname}`,
            password: await hash(tempPassword, 12),
            phone: phone,
            address: address,
            changePassword: true,
            firstLogin: true,
            userId: uuidv4(),
            role: role,
            memberId: memberId
        });

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        if (memberId && memberRev) {
            try {
                await dbService.delete("members", memberId, memberRev);
            } catch (cleanupErr) {
                logger.error({ cleanupErr }, "Rollback failed");
            }
        }
        logger.error({ err }, "members/add route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

membersRouter.post("/delete", async (req, resp) => {
    try {
        const { id } = req.body;

        if (!id) return resp.status(400).json({ errorMessage: "InvalidInputs" });

        const member = await dbService.read("members", id);
        const users = await dbService.find("users", { selector: { memberId: id }, limit: 1 });

        const user = users[0];

        if (!member) return resp.status(404).json({ errorMessage: "MemberNotFound" });
        // if (!user) return resp.status(404).json({ errorMessage: "UserNotFound" });

        await dbService.delete("members", member._id, member._rev);
        // await dbService.delete("users", user._id, user._rev);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "members/delete route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

membersRouter.post("/update", async (req, resp) => {
    // TODO: Update user data
    try {
        const { updatedMember } = req.body;
        if (!updatedMember?.id) {
            return resp.status(400).json({ errorMessage: "InvalidInputs" });
        }

        const member = await dbService.read("members", updatedMember.id);
        if (!member) {
            return resp.status(404).json({ errorMessage: "MemberNotFound" });
        }

        const { name, surname, email, phone, address, voice, status, role, birthdate, joined } = updatedMember;

        await dbService.update("members", {
            ...member,
            name,
            surname,
            email,
            phone,
            address,
            voice,
            status,
            role,
            birthdate,
            joined
        });

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "members/update route errorMessage");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

membersRouter.post("/update/status", async (req, resp) => {
    try {
        const { id } = req.body;
        if (!id) return resp.status(400).json({ errorMessage: "InvalidInputs" });

        const member = await dbService.read("members", id);
        if (!member) return resp.status(404).json({ errorMessage: "MemberNotFound" });

        if (member.status === "active") {
            await dbService.update("members", { ...member, status: "inactive" });
        } else {
            await dbService.update("members", { ...member, status: "active" });
        }

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "members/update/status route errorMessage");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

function validInputs(name: string, surname: string, email: string, phone: string, address: string, voice: string, status: string, role: string, birthdate: string, joined: number) {
    if (!name || !surname || !email || !phone || !address || !voice || !status || !role || !birthdate || !joined || name.trim() === "" || surname.trim() === "") {
        return false;
    }

    if (!validStatus.includes(status)) return false;
    if (!validRole.includes(role)) return false;
    if (!validVoice.includes(voice)) return false;
    return !(joined < minJoined || joined > maxJoined);
}

export { membersRouter };