import { Router } from "express";
import { dbService } from "../db.service";

const userRouter = Router();

userRouter.post("/data", async (req, resp) => {
    try {
        const { email } = req.body;

        const users = await dbService.find("users", {
            selector: { email: email },
            limit: 1,
        });

        const user = users[0];

        return resp
            .status(200)
            .json({ email: user.email, role: user.role, name: user.name });
    } catch (err: any) {
        console.error("Login route errorMessage: ", err);
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

export { userRouter };
