import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";

const libraryRouter = Router();

libraryRouter.get("/all", async (_, resp) => {
    try {
        const scores = (await dbService.list("library")).map(({ _id, _rev, files, ...score }) => ({ id: _id, ...score }));

        return resp.status(200).json({ data: scores });
    } catch (err: any) {
        logger.error({ err }, "library/all route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});


libraryRouter.post("/new", async (req, resp) => {
   try {

   } catch (err: any) {
       logger.error({ err }, "library/new route errorMessage: ");
       return resp.status(500).json({ errorMessage: "InternalServerError" });
   }
});

export default libraryRouter;