import { verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { logger } from "../logger";
import { dbService } from "../db.service";

/**
 * Minimal JWT payload used by this application.
 */
interface JwtPayload {
    userId: string;
}

/**
 * Express middleware that validates the Authorization header bearer token,
 * verifies it and attaches the `user` id to `req.user`.
 *
 * If the token is missing or invalid the middleware responds with `401`.
 */
async function authMiddleware(req: Request, resp: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return resp.status(401).json({ errorMessage: "InvalidToken" });

    const payload = verifyAuthToken(token);
    if (!payload) return resp.status(401).json({ errorMessage: "InvalidToken" });

    if (await checkForPasswordReset(payload.userId)) return resp.status(401).json({ errorMessage: "ResetPassword" });

    // Attach the authenticated user id to the request for downstream handlers
    req.user = payload.userId;
    next();
}

async function checkForPasswordReset(userId: string) {
    try {
        const user = await dbService.find("users", { selector: { userId: userId }, limit: 1 });
        if (!user) return true;
        return !!user[0].changePassword;
    } catch (error) {
        logger.error({ error }, "checkForPasswordReset failed");
        return true;
    }
}

/**
 * Verify a JWT and return the decoded payload.
 *
 * @param token - jwt token string
 * @returns decoded `JwtPayload` on success or `null` on failure
 */
function verifyAuthToken(token: string): JwtPayload | null {
    try {
        const secretKey = process.env.SECRET_KEY;
        if (!secretKey) {
            logger.error("SECRET_KEY is empty!");
            return null;
        }

        return verify(token, secretKey) as JwtPayload;
    } catch (error: any) {
        logger.error({ error }, "verifyAuthToken failed");
        return null;
    }
}

export default authMiddleware;