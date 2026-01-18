import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";

const reportsRouter = Router();

reportsRouter.get("/all", async (req, resp) => {
   try {
       const reports = (await dbService.list("reports")).map(({ _id, _rev, ...report }) => ({ id: _id, ...report }));

       return resp.status(200).json({ data: reports });
   } catch (err: any) {
       logger.error({ err }, "reports/all route errorMessage: ");
       return resp.status(500).json({ errorMessage: "InternalServerError" });
   }
});

reportsRouter.post("/add", async (req, resp) => {
   try {
       const { report } = req.body;

       if (!report) {
           return resp.status(400).json({ errorMessage: "InvalidInputs" });
       }

       await dbService.create("reports", report);

       return resp.status(200).json({ ok: true });
   } catch (err: any) {
       logger.error({ err }, "reports/add route errorMessage: ");
       return resp.status(500).json({ errorMessage: "InternalServerError" });
   }
});

export default reportsRouter;