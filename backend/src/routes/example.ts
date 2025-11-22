// This is an example code ONLY!

import { Router } from 'express';
import { dbService } from '../db.service';

const router = Router();

router.get('/', async(_, resp) => {
    // Do something
});

router.post('/', async (req, resp) => {
    const { name, email } = req.body;
    
    // DB Operations
    const insertResult = await dbService.create("members", { name: name, email: email });
    const newMember = await dbService.read("members", insertResult.id);

    resp.status(201).json(newMember);
});

export default router;