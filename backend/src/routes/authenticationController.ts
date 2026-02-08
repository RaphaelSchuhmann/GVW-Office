import { Router } from "express";
import { dbService } from "../db.service";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import authMiddleware from "../middlewares/authMiddleware";
import { logger } from "../logger";

const authRouter = Router();

/**
 * POST /login
 * Authenticate a user by email and password and return a JWT auth token.
 *
 * Request body:
 * - `{ email: string, password: string }`
 *
 * Responses:
 * - `200` : `{ authToken: string }` on success
 * - `401` : when password is invalid
 * - `404` : when no user for the provided email exists
 * - `500` : on unexpected server error
 */
authRouter.post("/login", async (req, resp) => {
    try {
        const { email, password } = req.body; // Salt Rounds for pw will be 12

        const users = await dbService.find("users", {
            selector: { email: email },
            limit: 1
        });

        if (users.length === 0) return resp.status(404).json({ errorMessage: "UserNotFound" }); // No user with this email

        const user = users[0];

        if (user.lockUntil && user.lockUntil > Date.now()) {
            return resp.status(429).json({ errorMessage: "AccountLocked", retryAfter: user.lockUntil });
        }

        const isPWMatch = await compare(password, user.password);
        if (!isPWMatch) {
            if (user.failedLoginAttempts >= 5) {
                await dbService.update("users", { ...user, lockUntil: Date.now() + 15 * 60 * 1000 });
                return resp.status(429).json({ errorMessage: "AccountLocked", retryAfter: user.lockUntil });
            } else {
                await dbService.update("users", { ...user, failedLoginAttempts: user.failedLoginAttempts + 1 });
                return resp.status(401).json({ errorMessage: "InvalidPassword" });
            }
        } else {
            await dbService.update("users", { ...user, failedLoginAttempts: 0, lockUntil: null });
        }

        const token = generateAuthToken(user.userId);

        return resp.status(200).json({
            authToken: token,
            changePassword: user.changePassword,
            firstLogin: user.firstLogin
        });
    } catch (error: any) {
        logger.error({ error }, "auth/login route errorMessage");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /dev
 * Development-only endpoint to reset all users and members data
 * Creates a default admin user for testing purposes
 * TODO: REMOVE THIS FOR PRODUCTION
 * 
 * Responses:
 * - `200`: Development user created successfully
 * - `500`: Error during user creation
 */
authRouter.post("/dev", async (req, resp) => {
    try {
        const users = await dbService.list("users");
        const members = await dbService.list("members");

        for (const user of users) {
            await dbService.delete("users", user._id, user._rev);
        }

        for (const member of members) {
            await dbService.delete("members", member._id, member._rev);
        }

        const member = await dbService.create("members", {
            name: "Raphael",
            surname: "Schuhmann",
            email: "raphael221@outlook.de",
            phone: "01701234 5678",
            address: "Musterstraße 1, 12345 Musterstadt",
            voice: "tenor1",
            status: "active",
            role: "admin",
            birthdate: "01.01.2000",
            joined: "2016"
        });

        await dbService.create("users", {
            email: "raphael221@outlook.de",
            name: "Raphael Schuhmann",
            password: await hash("123", 12),
            phone: "01701234 5678",
            address: "Musterstraße 1, 12345 Musterstadt",
            changePassword: true,
            firstLogin: true,
            userId: uuidv4(),
            role: "admin",
            memberId: member.id,
            failedLoginAttempts: 0,
            lockUntil: null
        });
        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "Error generating development user");
        return resp.status(500).json({ ok: false });
    }
});

/**
 * GET /auto
 * Automatically authenticate user using JWT token from Authorization header
 * Returns user information if token is valid
 * 
 * Headers:
 * - `Authorization: Bearer <token>`
 * 
 * Responses:
 * - `200`: User authenticated successfully, returns email and changePassword flag
 * - `401`: Invalid or missing token
 * - `404`: User not found
 * - `500`: Internal server error
 */
authRouter.get("/auto", authMiddleware, async (req, resp) => {
    try {
        const userId = req.user;
        if (!userId) return resp.status(401).json({ errorMessage: "InvalidToken" }); // UserId should not be empty: invalid auth token

        const users = await dbService.find("users", {
            selector: { userId: userId },
            limit: 1
        });

        if (users.length === 0) return resp.status(404).json({ errorMessage: "UserNotFound" });

        const user = users[0];

        resp.status(200).json({ email: user.email, changePassword: user.changePassword });
    } catch (err: any) {
        logger.error({ err }, "auth/auto route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * POST /changePW
 * Change a user's password after validating their current password
 * 
 * Request body:
 * - `{ email: string, oldPw: string, newPw: string }`
 * 
 * Responses:
 * - `200`: Password changed successfully
 * - `401`: Invalid current password
 * - `404`: User not found
 * - `409`: New password matches current password
 * - `500`: Internal server error
 */
authRouter.post("/changePW", async (req, resp) => {
    try {
        const { email, oldPw, newPw } = req.body;

        const users = await dbService.find("users", {
            selector: { email: email },
            limit: 1
        });

        if (users.length === 0) return resp.status(404).json({ ok: false });

        const user = users[0];

        // Check if old password is same as new one
        const isPWMatch = await compare(newPw, user.password);
        if (isPWMatch) return resp.status(409).json({ errorMessage: "SamePasswordAsOld" });

        // Authenticate user
        const validPW = await compare(oldPw, user.password);
        if (!validPW) return resp.status(401).json({ errorMessage: "InvalidPassword" });

        const updatedDoc = { ...user, password: await hash(newPw, 12), changePassword: false, firstLogin: false };
        await dbService.update("users", updatedDoc);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "auth/changePW route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

/**
 * Generate a temporary password from capitalized words and digits
 * Creates a readable password by combining random words and numbers
 * 
 * @param wordCount - Number of words to include (default: 3)
 * @param numberCount - Number of digits to include (default: 2)
 * @returns Promise resolving to the plaintext temporary password
 */
async function generateTempPassword(
    wordCount = 3,
    numberCount = 2
): Promise<string> {
    try {
        const words = [
            "apple",
            "banana",
            "chorus",
            "melody",
            "note",
            "voice",
            "sing",
            "harmony",
            "music",
            "choir",
            "pineapple",
            "gvw"
        ];

        const chosenWords = Array.from({ length: wordCount }, () => {
            const word = words[Math.floor(Math.random() * words.length)];
            return word.charAt(0).toUpperCase() + word.slice(1);
        });

        const digits = Array.from({ length: numberCount }, () =>
            Math.floor(Math.random() * 10).toString()
        );

        const combined = [...chosenWords, ...digits];
        for (let i = combined.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }

        return combined.join("");
    } catch (err: any) {
        logger.error({ err }, "Error generating temporary password: ");
        return "";
    }
}

/**
 * Create a JWT token for a given user ID
 * 
 * @param userId - Identifier of the authenticated user
 * @throws Error when `process.env.SECRET_KEY` is not set
 * @returns Signed JWT string valid for 7 days
 */
function generateAuthToken(userId: string) {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) {
        logger.error("SECRET_KEY is empty!");
        throw new Error("SECRET_KEY is empty!");
    }

    return sign({ userId }, secretKey, { expiresIn: 7 * 24 * 60 * 60 });
}

export { authRouter, generateTempPassword };
