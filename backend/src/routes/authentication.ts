import { Router } from "express";
import { dbService } from "../db.service";
import { compare, hash } from "bcrypt";
import { sign } from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import authMiddleware from "../middlewares/authMiddleware";

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
            limit: 1,
        });

        if (users.length === 0) return resp.status(404).json({ ok: false }); // No user with this email

        const user = users[0];

        const isPWMatch = await compare(password, user.password);
        if (!isPWMatch) return resp.status(401).json({ ok: false }); // Invalid PW

        const token = generateAuthToken(user.userId);

        return resp.status(200).json({ authToken: token, changePassword: user.changePassword, firstLogin: user.firstLogin });
    } catch (error: any) {
        console.error("Login route error: ", error);
        return resp.status(500).json({ ok: false });
    }
});

// ! TODO REMOVE THIS FOR PROD
authRouter.post("/dev", async (req, resp) => {
    try {
        const users = await dbService.list("users");
        users.forEach(async (user) => {
            await dbService.delete("users", user._id, user._rev);
        });

        await dbService.create("users", {
            email: "raphael221@outlook.de",
            password: await hash("123", 12),
            changePassword: true,
			firstLogin: true,
            userId: uuidv4(),
			role: "member",
        });
        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        console.error("Error generating development user: ", err);
        return resp.status(500).json({ ok: false });
    }
});

authRouter.get("/auto", authMiddleware, async (req, resp) => {
    try {
        const userId = req.user;
        if (!userId) return resp.status(401).json({ ok: false }); // UserId should not be empty: invalid auth token

        const users = await dbService.find("users", {
            selector: { userId: userId },
            limit: 1,
        });

        if (users.length === 0) return resp.status(404).json({ ok: false });

		const user = users[0];

        resp.status(200).json({ email: user.email, role: user.role, changePassword: user.changePassword });
    } catch (err: any) {
        console.error("Error auto getting user: ", err);
        return resp.status(500).json({ ok: false });
    }
});

/**
 * POST /changePW
 * Change a user's password to a new value. This endpoint expects the
 * user's email and the new password in the request body.
 *
 * Request body:
 * - `{ email: string, newPw: string }`
 *
 * Responses:
 * - `200` : when password update succeeded
 * - `404` : when user not found
 * - `409` : when new password matches the current password
 * - `500` : on unexpected server error
 */
authRouter.post("/changePW", async (req, resp) => {
    try {
        const { email, oldPw, newPw } = req.body;

        const users = await dbService.find("users", {
            selector: { email: email },
            limit: 1,
        });

        if (users.length === 0) return resp.status(404).json({ ok: false });

        const user = users[0];

        // Check if old password is same as new one
        const isPWMatch = await compare(newPw, user.password);
        if (isPWMatch) return resp.status(409).json({ ok: false });

        // Authenticate user
        const validPW = await compare(oldPw, user.password);
        if (!validPW) return resp.status(401).json({ ok: false });

        const updatedDoc = { ...user, password: await hash(newPw, 12), changePassword: false, firstLogin: false };
        await dbService.update("users", updatedDoc);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        console.error("Change Password route error: ", err);
        return resp.status(500).json({ ok: false });
    }
});

/**
 * POST /tempPassword
 * Generate and assign a temporary password for the user identified by email.
 *
 * Request body:
 * - `{ email: string }`
 *
 * Responses:
 * - `200` : when temporary password was set
 * - `404` : when user not found
 * - `500` : on unexpected server error
 */
authRouter.post("/tempPassword", async (req, resp) => {
    try {
        const { email } = req.body;

        const users = await dbService.find("users", {
            selector: { email: email },
            limit: 1,
        });

        if (users.length === 0) return resp.status(404).json({ ok: false });

        const user = users[0];

        const updatedDoc = { ...user, password: generateTempPassword() };
        await dbService.update("users", updatedDoc);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        console.error("Temp Password route error: ", err);
        return resp.status(500).json({ ok: false });
    }
});

/**
 * Generate a temporary password from capitalized words and digits, then
 * hash it with bcrypt and return the hash.
 *
 * The function composes a plaintext password by selecting `wordCount`
 * capitalized words and `numberCount` digits, shuffles the parts, and
 * returns a bcrypt hash of the resulting plaintext. The plaintext
 * password is not returned by this function — callers receive the
 * hashed password suitable for storing in the database.
 *
 * Note: the function uses 12 bcrypt salt rounds when hashing.
 *
 * @param wordCount - number of words to include (default: 3)
 * @param numberCount - number of digits to include (default: 2)
 * @returns A Promise resolving to the bcrypt hash of the generated password.
 *          On error the function logs the error and resolves to an empty
 *          string.
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
            "gvw",
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

        return await hash(combined.join(""), 12);
    } catch (err: any) {
        console.error("Error generating temporary password: ", err);
        return "";
    }
}

/**
 * Create a JWT for a given user id.
 *
 * @param userId - identifier of the authenticated user
 * @throws Error when `process.env.SECRET_KEY` is not set
 * @returns signed JWT string valid for 7 days
 */
function generateAuthToken(userId: string) {
    const secretKey = process.env.SECRET_KEY;
    if (!secretKey) throw new Error("SECRET_KEY is empty!");

    return sign({ userId }, secretKey, { expiresIn: "7d" });
}

export { authRouter, generateTempPassword };
