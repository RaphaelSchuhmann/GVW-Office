import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";
import { sendMail } from "../mailer/mailer";
import { loadTemplate } from "../mailer/loadTemplate";
import { createHash, randomBytes } from "node:crypto";
import { generateTempPassword } from "./authenticationController";
import { hash } from "bcrypt";

const emergencyRouter = Router();
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days


emergencyRouter.post("/use", requireLocalhost, async (req, resp) => {
    try {
        const tokenInput: string = req.body.token;
        if (!tokenInput) return resp.status(400).json({ errorMessage: "TokenMissing" });

        const storedTokens = await dbService.find("emergency_token", { selector: {}, limit: 1 });
        const storedToken = storedTokens[0];
        if (!storedToken) {
            logger.warn("No emergency token found");
            return resp.status(404).json({ errorMessage: "TokenNotFound" });
        }

        // Expiration check
        if (storedToken.createdAt && new Date(storedToken.expiresAt) < new Date()) {
            logger.warn("Emergency token expired");
            return resp.status(401).json({ errorMessage: "TokenExpired" });
        }

        // Hash + compare
        const hashedInput: string = createHash("sha256").update(tokenInput).digest("hex");
        if (hashedInput !== storedToken.token) {
            logger.warn("Emergency token invalid");
            return resp.status(401).json({ errorMessage: "TokenInvalid" });
        }

        logger.info(`Emergency token accepted at ${new Date().toISOString()}`);

        // Load admins
        const admins = await dbService.find("users", { selector: { role: "admin" } });

        // Reset admin passwords
        for (const admin of admins) {
            const temporaryPassword = await generateTempPassword();
            await dbService.update("users", {
                ...admin,
                password: await hash(temporaryPassword, 12),
                changePassword: true
            });

            const html: string = await loadTemplate("resetPassword", { tempPassword: temporaryPassword });

            await sendMail({
                to: admin.email,
                subject: "Notfallzugang verwendet - Passwort zurückgesetzt",
                content: html
            });
        }

        // Rotate token
        const newToken = generateToken();
        const newHash = createHash("sha256").update(newToken).digest("hex");

        await dbService.update("emergency_token", {
            ...storedToken,
            token: newHash,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
        });

        // Notify admins that emergency access was used
        const notifyHtml = await loadTemplate("emergencyTokenUsed", {});
        for (const admin of admins) {
            await sendMail({
                to: admin.email,
                subject: "Notfallzugang verwendet",
                content: notifyHtml
            });
        }

        return resp.status(200).json({ token: newToken });
    } catch (err) {
        logger.error({ err }, "emergency/use endpoint");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

emergencyRouter.get("/new", requireLocalhost, async (req, resp) => {
    try {
        const token: string = generateToken();
        const newHash: string = createHash('sha256').update(token).digest("hex");

        const existingTokens = await dbService.find("emergency_token", { selector: {}, limit: 1 });

        if (existingTokens.length === 0) {
            await dbService.create("emergency_token", {
                token: newHash,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
            });
        } else {
            await dbService.update("emergency_token", {
                ...existingTokens[0],
                token: newHash,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + TOKEN_TTL_MS)
            });
        }

        logger.info("Emergency token manually regenerated");

        return resp.status(200).json({ token: token });
    } catch (err) {
        logger.error({ err }, "emergency/new endpoint");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

function requireLocalhost(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.socket.remoteAddress;
    if (ip !== "127.0.0.1" && ip !== "::1" && ip !== "::ffff:127.0.0.1") {
        return res.status(403).send("Forbidden");
    }
    next();
}

export function generateToken(byteLength = 64) {
    return randomBytes(byteLength).toString("base64url");
}

export default emergencyRouter;