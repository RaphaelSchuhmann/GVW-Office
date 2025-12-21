import { Router } from 'express';
import { dbService } from "../db.service";

const router = Router();

router.get('/', async(_, resp) => {
    resp.status(200).json({ status: "ok" });
});

router.get('/generateDBs', async (_, resp) => {
    try {
        await dbService.generateDatabases();

        resp.status(200).json({ status: "ok" });
    } catch (err) {
        resp.status(500).json({ status: "error", error: err });
    }
})

export default router;