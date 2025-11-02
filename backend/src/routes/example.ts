// This is an example code ONLY!

import { Router } from 'express';
import prisma from '../db/prisma';

const router = Router();

router.get('/', async(_, resp) => {
    // Do something
});

router.post('/', async (req, resp) => {
    const { name, email } = req.body;
    const newMember = await prisma.member.create({ data: { name, email } });
    resp.status(201).json(newMember);
});

export default router;