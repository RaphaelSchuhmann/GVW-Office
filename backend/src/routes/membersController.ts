import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";
import { hash } from "bcrypt";
import { v4 as uuidv4 } from "uuid";
import { generateTempPassword } from "./authenticationController";
import { loadTemplate } from "../mailer/loadTemplate";
import { sendMail } from "../mailer/mailer";

const membersRouter = Router();

const validStatus = ["active", "inactive"];
const validRole = ["member", "admin", "schriftführer", "vorstand"];
const validVoice = ["tenor1", "tenor2", "bass1", "bass2"];
const minJoined = 1924;
const maxJoined = new Date().getFullYear() + 1;

/**
 * GET /all
 * Retrieves all members from the database
 * 
 * Responses:
 * - `200`: Array of all members with id field instead of _id
 * - `500`: Internal server error
 */
membersRouter.get("/all", async (_, resp) => {
    try {
        const members = (await dbService.list("members")).map(({ _id, _rev, ...member }) => ({ id: _id, ...member }));

        return resp.status(200).json({ data: members });
    } catch (err: any) {
        logger.error({ err }, "members/all route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /add
 * Creates a new member and associated user account with temporary password
 * Sends welcome email with temporary password to the new member
 * 
 * Request body:
 * - `{ name, surname, email, phone, address, voice, status, role, birthdate, joined }`
 * 
 * Responses:
 * - `200`: Member created successfully
 * - `400`: Invalid input data
 * - `409`: Email already in use
 * - `500`: Internal server error
 */
membersRouter.post("/add", async (req, resp) => {
    let memberId: string | null = null;
    let memberRev: string | null = null;

    try {
        const { name, surname, email, phone, address, voice, status, role, birthdate, joined } = req.body;

        // Validate inputs
        if (!validInputs(name, surname, email, phone, address, voice, status, role, birthdate, joined))
            return resp.status(400).json({ errorMessage: "InvalidInputs" });

        // Check if there is already a user with the given email
        const users = await dbService.find("users", { selector: { email: email }, limit: 1 });
        if (users.length > 0) return resp.status(409).json({ errorMessage: "EmailAlreadyInUse" });

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
            memberId: memberId,
            failedLoginAttempts: 0,
            lockUntil: null
        });

        const html = await loadTemplate("newUser", { tempPassword: tempPassword });

        await sendMail({
            to: email,
            subject: "Temporäres Passwort",
            content: html
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

/**
 * POST /delete
 * Deletes a member and their associated user account
 * 
 * Request body:
 * - `{ id: string }`
 * 
 * Responses:
 * - `200`: Member deleted successfully
 * - `400`: Invalid input data
 * - `404`: Member or user not found
 * - `500`: Internal server error
 */
membersRouter.post("/delete", async (req, resp) => {
    try {
        const { id } = req.body;

        if (!id) return resp.status(400).json({ errorMessage: "InvalidInputs" });

        const member = await dbService.read("members", id);
        const users = await dbService.find("users", { selector: { memberId: id }, limit: 1 });

        const user = users[0];

        if (!member) return resp.status(404).json({ errorMessage: "MemberNotFound" });
        if (!user) return resp.status(404).json({ errorMessage: "UserNotFound" });

        await dbService.delete("members", member._id, member._rev);
        await dbService.delete("users", user._id, user._rev);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "members/delete route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /update
 * Updates member and associated user account information
 * 
 * Request body:
 * - `{ id, name, surname, email, phone, address, voice, status, role, birthdate, joined }`
 * 
 * Responses:
 * - `200`: Member updated successfully
 * - `400`: Invalid input data
 * - `404`: Member or user not found
 * - `500`: Internal server error
 */
membersRouter.post("/update", async (req, resp) => {
    try {
        const { id, name, surname, email, phone, address, voice, status, role, birthdate, joined } = req.body;
        if (!validInputs(name, surname, email, phone, address, voice, status, role, birthdate, joined) || !id) {
            return resp.status(400).json({ errorMessage: "InvalidInputs" });
        }

        const member = await dbService.read("members", id);
        if (!member) return resp.status(404).json({ errorMessage: "MemberNotFound" });

        const users = await dbService.find("users", { selector: { memberId: id }, limit: 1 });

        const user = users[0];
        if (!user) return resp.status(404).json({ errorMessage: "UserNotFound" });

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

        await dbService.update("users", {
            ...user,
            name: `${name} ${surname}`,
            email,
            phone,
            address,
            role,
            memberId: id
        });

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "members/update route errorMessage");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /update/status
 * Toggles member status between active and inactive
 * 
 * Request body:
 * - `{ id: string }`
 * 
 * Responses:
 * - `200`: Status updated successfully
 * - `400`: Invalid input data
 * - `404`: Member not found
 * - `500`: Internal server error
 */
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

/**
 * Validates member input data
 * @param name - Member's first name
 * @param surname - Member's last name
 * @param email - Member's email address
 * @param phone - Member's phone number
 * @param address - Member's address
 * @param voice - Member's voice type (tenor1, tenor2, bass1, bass2)
 * @param status - Member's status (active, inactive)
 * @param role - Member's role (member, admin, schriftführer, vorstand)
 * @param birthdate - Member's birthdate
 * @param joined - Year member joined
 * @returns True if all inputs are valid, false otherwise
 */
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