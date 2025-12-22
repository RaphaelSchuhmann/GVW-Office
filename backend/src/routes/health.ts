import { Router } from 'express';
import { dbService } from "../db.service";
import { logger } from "../logger";

const router = Router();

router.get('/', async(_, resp) => {
    resp.status(200).json({ status: "ok" });
});

router.get('/generateDBs', async (_, resp) => {
    try {
        await dbService.generateDatabases();

        resp.status(200).json({ status: "ok" });
    } catch (err) {
        logger.error({ err }, "Error generating databases");
        resp.status(500).json({ status: "error", error: err });
    }
})

export default router;