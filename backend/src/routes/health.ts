// This is an example code ONLY!

import { Router } from 'express';

const router = Router();

router.get('/', async(_, resp) => {
    resp.status(200).json({ status: "ok" });
});

export default router;