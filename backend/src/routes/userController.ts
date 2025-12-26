import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";

const userRouter = Router();

userRouter.post("/data", async (req, resp) => {
    try {
        const { email } = req.body;

        const users = await dbService.find("users", {
            selector: { email: email },
            limit: 1
        });

        if (users.length === 0) return resp.status(404).json({ errorMessage: "UserNotFound" });

        const user = users[0];

        return resp
            .status(200)
            .json({ email: user.email, role: user.role, name: user.name });

    } catch (err: any) {
        logger.error({ err }, "user/data route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

userRouter.post("/update", async (req, resp) => {
    // TODO: Update member data (email, phone, address)
    try {
        const { originalEmail, email, phone, address } = req.body;

        const users = await dbService.find("users", {
            selector: { email: originalEmail },
            limit: 1
        });

        if (users.length === 0) return resp.status(404).json({ errorMessage: "UserNotFound" });

        // Update user data
        const user = users[0];
        const updatedDoc = { ...user, email: email, phone: phone, address: address };
        await dbService.update("users", updatedDoc);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "user/update route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

export { userRouter };
