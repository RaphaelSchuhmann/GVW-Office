import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";

const reportsRouter = Router();

/**
 * GET /all
 * Retrieves all reports from the database
 *
 * Responses:
 * - `200`: Array of all reports with id field instead of _id
 * - `500`: Internal server error
 */
reportsRouter.get("/all", async (req, resp) => {
   try {
       const reports = (await dbService.list("reports")).map(({ _id, _rev, ...report }) => ({ id: _id, ...report }));

       return resp.status(200).json({ data: reports });
   } catch (err: any) {
       logger.error({ err }, "reports/all route errorMessage: ");
       return resp.status(500).json({ errorMessage: "InternalServerError" });
   }
});

/**
 * POST /add
 * Creates a new report in the database
 *
 * Request body:
 * - `{ report: ReportObject }`
 *
 * Responses:
 * - `200`: Report created successfully
 * - `400`: Invalid input data
 * - `500`: Internal server error
 */
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

/**
 * POST /delete
 * Deletes a report from the database
 *
 * Request body:
 * - `{ id: string }`
 *
 * Responses:
 * - `200`: Report deleted successfully
 * - `400`: Invalid input data
 * - `404`: Report not found
 * - `500`: Internal server error
 */
reportsRouter.post("/delete", async (req, resp) => {
    try {
        const { id } = req.body;

        if (!id) return resp.status(400).json({ errorMessage: "InvalidInputs" });

        const report = await dbService.read("reports", id);
        if (!report) return resp.status(404).json({ errorMessage: "ReportNotFound" });

        await dbService.delete("reports", report._id, report._rev);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "reports/delete route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

export default reportsRouter;