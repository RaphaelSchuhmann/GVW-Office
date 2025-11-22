import { Jwt, verify } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

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
function authMiddleware(req: Request, resp: Response, next: NextFunction) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return resp.status(401);

    const payload = verifyAuthToken(token);
    if (!payload) return resp.status(401);

    // Attach the authenticated user id to the request for downstream handlers
    req.user = payload.userId;
    next();
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
        if (!secretKey) throw new Error("SECRET_KEY is empty!");

        return verify(token, secretKey) as JwtPayload;
    } catch (error: any) {
        console.error("verifyAuthToken failed: ", error);
        return null;
    }
}

export default authMiddleware;