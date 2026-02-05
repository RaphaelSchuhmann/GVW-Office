import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";
import { generateTempPassword } from "./authenticationController";
import { hash } from "bcrypt";
import { sendMail } from "../mailer/mailer";
import { loadTemplate } from "../mailer/loadTemplate";

const userRouter = Router();

/**
 * POST /data
 * Retrieves user data by email address
 * 
 * Request body:
 * - `{ email: string }`
 * 
 * Responses:
 * - `200`: User data (email, role, name, address, phone)
 * - `404`: User not found
 * - `500`: Internal server error
 */
userRouter.get("/data", async (req, resp) => {
    try {
        const userId = req.user;

        if (!userId) return resp.status(404).json({ errorMessage: "UserNotFound" });

        const users = await dbService.find("users", {
            selector: { userId: userId },
            limit: 1
        });

        if (users.length === 0) return resp.status(404).json({ errorMessage: "UserNotFound" });

        const user = users[0];

        return resp
            .status(200)
            .json({ email: user.email, role: user.role, name: user.name, address: user.address, phone: user.phone });

    } catch (err: any) {
        logger.error({ err }, "user/data route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /update
 * Updates user and associated member data
 * 
 * Request body:
 * - `{ originalEmail: string, email: string, phone: string, address: string }`
 * 
 * Responses:
 * - `200`: Update successful
 * - `404`: User or member not found
 * - `500`: Internal server error
 */
userRouter.post("/update", async (req, resp) => {
    try {
        const { originalEmail, email, phone, address } = req.body;

        const users = await dbService.find("users", {
            selector: { email: originalEmail },
            limit: 1
        });

        const user = users[0];
        if (!user) return resp.status(404).json({ errorMessage: "UserNotFound" });

        const members = await dbService.find("members", {
            selector: { _id: user.memberId },
            limit: 1
        });

        const member = members[0];
        if (!member) return resp.status(404).json({ errorMessage: "MemberNotFound" });

        // Update user
        await dbService.update("users", { ...user, email: email, phone: phone, address: address });

        // Update member
        await dbService.update("members", { ...member, email: email, phone: phone, address: address });

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "user/update route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /reset/password
 * Generate and assign a temporary password for the user identified by memberId.
 * Sends the new password via email to the user.
 *
 * Request body:
 * - `{ memberId: string }`
 *
 * Responses:
 * - `200`: Temporary password was set and email sent
 * - `404`: User not found
 * - `500`: Internal server error
 */
userRouter.post("/reset/password", async (req, resp) => {
    try {
        const { memberId } = req.body;

        const users = await dbService.find("users", {
            selector: { memberId: memberId },
            limit: 1
        });

        if (users.length === 0) return resp.status(404).json({ errorMessage: "UserNotFound" });

        const user = users[0];

        let temporaryPassword = await generateTempPassword();

        const updatedDoc = { ...user, password: await hash(temporaryPassword, 12), changePassword: true };
        await dbService.update("users", updatedDoc);

        const html = await loadTemplate("newUser", { tempPassword: temporaryPassword });

        await sendMail({
            to: user.email,
            subject: "Passwort zurückgesetzt",
            content: html
        });

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "auth/tempPassword route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

export default userRouter;
