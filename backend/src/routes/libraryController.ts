import { Router } from "express";
import { dbService } from "../db.service";
import { logger } from "../logger";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { randomUUID } from "node:crypto";
import archiver from "archiver";

const libraryRouter = Router();
const SCORES_DIR = process.env.SCORE_DATA_DIR;

interface File {
    id: string;
    originalName: string;
    mimeType: any;
    size: number;
    extension: string;
}

libraryRouter.get("/all", async (_, resp) => {
    try {
        const scores = (await dbService.list("library")).map(
            ({ _id, _rev, files, ...score }) => ({ 
                id: _id, 
                ...score,
                paths: files?.map(
                    ({ originalName }: { originalName: string }) => `${originalName}`
                ) ?? []
            })
        );

        return resp.status(200).json({ data: scores });
    } catch (err: any) {
        logger.error({ err }, "library/all route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

const libraryUpload = multer({
    storage: multer.memoryStorage()
});

libraryRouter.post("/new", libraryUpload.array("files"), async (req, resp) => {
   try {
        const { title, artist, type, voices, voiceCount } = req.body;

        if (!title || !artist || !type || !voices || !voiceCount) {
            return resp.status(400).json({ errorMessage: "InvalidInputs" });
        }

        let parsedVoices;
        try {
            parsedVoices = JSON.parse(voices);
        } catch (err: any) {
            return resp.status(400).json({ errorMessage: "InvalidInputs" });
        }

        const voiceCountNum = Number(voiceCount)
        if (Number.isNaN(voiceCountNum)) {
            return resp.status(400).json({ errorMessage: "InvalidInputs" });
        }

        const exists = await dbService.find("library", { selector: { title: title, artist: artist }, limit: 1 });
        if (exists.length > 0) return resp.status(409).json({ errorMessage: "AlreadyExists" });

        const files = await storeFiles(req.files ?? []);

        await dbService.create("library", {
            title: title,
            artist: artist,
            type: type,
            voices: parsedVoices,
            voiceCount: voiceCountNum,
            files: files
        });

        return resp.status(200).json({ ok: true });
   } catch (err: any) {
       logger.error({ err }, "library/new route errorMessage: ");
       return resp.status(500).json({ errorMessage: "InternalServerError" });
   }
});

async function storeFiles(uploadedFiles: any): Promise<File[]> {
    const storedFiles: File[] = [];
    const targetDir = SCORES_DIR ?? "./data/scores";

    await fs.mkdir(targetDir, { recursive: true });

    for (const file of uploadedFiles) {
        const id = randomUUID();
        const ext = path.extname(file.originalname);

        if (!SCORES_DIR) console.error("SCORES_DIR is not defined!");

        const targetPath = path.join(targetDir, `${id}${ext}`);

        await fs.writeFile(targetPath, file.buffer);

        storedFiles.push({
            id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            extension: ext.slice(1)
        });
    }

    return storedFiles;
}

async function deleteFile(fileName: string) {
    const targetDir = SCORES_DIR ?? "./data/scores";

    const filePath = path.join(targetDir, fileName);

    try {
        await fs.unlink(filePath);
    } catch (err: any) {
        logger.error({ err, filePath }, "Failed to delete score file");
    }
}

/**
 * POST /delete
 * Deletes a score from the database and deletes
 * referenced files
 *
 * Request body:
 * - `{ id: string }`
 *
 * Responses:
 * - `200`: Score deleted successfully
 * - `400`: Invalid input data
 * - `404`: Score not found
 * - `500`: Internal server error
 */
libraryRouter.post("/delete", async (req, resp) => {
    try {
        const { id } = req.body;

        if (!id) return resp.status(400).json({ errorMessage: "InvalidInputs" });

        const score = await dbService.read("library", id);
        if (!score) return resp.status(404).json({ errorMessage: "ScoreNotFound" });

        if (score.files) {
            for (const file of score.files) {
                await deleteFile(`${file.id}.${file.extension}`);
            }
        }

        await dbService.delete("library", score._id, score._rev);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "library/delete route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

libraryRouter.get("/:id/files", async (req, resp) => {
    try {
        const id = req.params.id;

        const score = await dbService.read("library", id);
        if (!score) return resp.status(404).json({ errorMessage: "ScoreNotFound" });

        if (score.files && score.files.length > 0) {
            resp.setHeader("Content-Type", "application/zip");
            const sanitizedTitle = score.title.replace(/["\r\n]/g, "_");
            resp.setHeader("Content-Disposition", `attachment; filename="${sanitizedTitle}.zip"`);

            const archive = archiver("zip", { zlib: { level: 9 } });

            archive.on("error", (err) => {
                logger.error({ err }, "Archive error during ZIP creation");
                if (!resp.headersSent) {
                    return resp.status(500).json({ errorMessage: "InternalServerError" });
                }
            });

            archive.pipe(resp);

            const targetDir = SCORES_DIR ?? "./data/scores";

            for (const file of score.files) {
                const filePath = path.join(targetDir, `${file.id}.${file.extension}`);

                try {
                    await fs.access(filePath);
                    const safeName = path.basename(file.originalName).replace(/[\r\n]/g, "_") || "score";
                    archive.file(filePath, { name: safeName });
                } catch {
                    logger.warn({ filePath }, "File not found, skipping...");
                }
            }

            await archive.finalize();
            return;
        } else {
            return resp.status(404).json({ errorMessage: "NoFilesFound" });
        }
    } catch (err: any) {
        logger.error({ err }, "library/:id/files route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

libraryRouter.post("/update", libraryUpload.array("files"), async (req, resp) => {
    try {
        const { id, title, artist, type, voices, voiceCount } = req.body;

        if (!title || !artist || !type || !voices || !voiceCount) {
            return resp.status(400).json({ errorMessage: "InvalidInputs" });
        }

        const score = await dbService.read("library", id);

        if (!score) return resp.status(404).json({ errorMessage: "ScoreNotFound" });

        const originalFiles: string[] = Array.isArray(req.body.originalFiles)
            ? req.body.originalFiles
            : req.body.originalFiles
                ? JSON.parse(req.body.originalFiles)
                : [];

        let files: File[] = score.files;

        // remove deleted files
        const removedFiles = files.filter(f => !originalFiles.includes(f.originalName));

        for (const file of removedFiles) {
            await deleteFile(file.originalName);
        }

        files = files.filter(f => originalFiles.includes(f.originalName));

        // add new files
        if (req.files && Array.isArray(req.files)) {
            const newFiles = await storeFiles(req.files);
            files = [...files, ...newFiles];
        }

        const updatedScore = {
            ...score,
            title,
            artist,
            type,
            voices,
            voiceCount,
            files
        };

        await dbService.update("library", updatedScore);

        return resp.status(200).json({ ok: true });
    } catch (err: any) {
        logger.error({ err }, "library/update route errorMessage: ");
        return resp.status(500).json({ errorMessage: "InternalServerError" });
    }
});

export default libraryRouter;