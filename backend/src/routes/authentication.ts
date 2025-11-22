import { Router } from "express";
import { dbService } from "../db.service";
import { compare } from "bcrypt";
import { sign } from "jsonwebtoken";
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

        if (users.length === 0) return resp.status(404); // No user with this email

        const user = users[0];

        const isPWMatch = await compare(password, user.password);
        if (!isPWMatch) return resp.status(401); // Invalid PW

        const token = generateAuthToken(user.userId);

        resp.status(200).json({ authToken: token });
    } catch (error: any) {
        console.error("Login route error: ", error);
        return resp.status(500);
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
        const { email, newPw } = req.body;

        const users = await dbService.find("users", {
            selector: { email: email },
            limit: 1,
        });

        if (users.length === 0) return resp.status(404);

        const user = users[0];

        // Check if old password is same as new one
        const isPWMatch = await compare(newPw, user.password);
        if (isPWMatch) return resp.status(409);

        const updatedDoc = { ...user, password: newPw };
        await dbService.update("users", updatedDoc);

        resp.status(200);
    } catch (err: any) {
        console.error("Change Password route error: ", err);
        return resp.status(500);
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

        if (users.length === 0) return resp.status(404);

        const user = users[0];

        const updatedDoc = { ...user, password: generateTempPassword() };
        await dbService.update("users", updatedDoc);

        resp.status(200);
    } catch (err: any) {
        console.error("Temp Password route error: ", err);
        return resp.status(500);
    }
});

/**
 * Generate a human-friendly temporary password composed of capitalized words
 * and digits.
 *
 * @param wordCount - number of words to include (default: 3)
 * @param numberCount - number of digits to include (default: 2)
 * @returns generated password string
 */
function generateTempPassword(wordCount = 3, numberCount = 2): string {
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

    return combined.join("");
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

export {authRouter, generateTempPassword};
