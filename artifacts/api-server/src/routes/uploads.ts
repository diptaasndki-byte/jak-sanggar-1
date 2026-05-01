import {
  Router,
  type IRouter,
  type Request,
  type Response,
  type NextFunction,
  type ErrorRequestHandler,
} from "express";
import multer from "multer";
import { randomBytes } from "node:crypto";
import { extname } from "node:path";
import { db, uploadsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { paramId, requireAuth } from "../middlewares/auth";
import { putObject, getObject, buildDownloadUrl } from "../lib/storage";

const router: IRouter = Router();

const MAX_BYTES = 10 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
});

const uploadErrorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({ error: "Berkas terlalu besar (maks 10 MB)" });
      return;
    }
    res.status(400).json({ error: `Upload gagal: ${err.message}` });
    return;
  }
  next(err);
};

router.post(
  "/uploads",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("file")(req, res, (err: unknown) => {
      if (err) {
        uploadErrorHandler(err, req, res, next);
        return;
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    const file = (req as Request & { file?: Express.Multer.File }).file;
    if (!file) {
      res.status(400).json({ error: "Berkas tidak ditemukan" });
      return;
    }
    const ext = extname(file.originalname || "").toLowerCase();
    const key = `${Date.now()}-${randomBytes(6).toString("hex")}${ext}`;
    await putObject(key, file.buffer, file.mimetype);
    const inserted = await db
      .insert(uploadsTable)
      .values({
        storageKey: key,
        contentType: file.mimetype,
        sizeBytes: file.size,
        originalName: file.originalname || null,
        uploaderId: req.user!.id,
      })
      .returning();
    const row = inserted[0]!;
    res.status(201).json({
      id: row.id,
      url: buildDownloadUrl(row.id),
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
      originalName: row.originalName,
      createdAt: row.createdAt.toISOString(),
    });
  },
);

router.get("/uploads/:id", requireAuth, async (req: Request, res: Response) => {
  const id = paramId(req);
  const rows = await db
    .select()
    .from(uploadsTable)
    .where(eq(uploadsTable.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }
  res.json({
    id: row.id,
    url: buildDownloadUrl(row.id),
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    originalName: row.originalName,
    createdAt: row.createdAt.toISOString(),
  });
});

router.get("/uploads/:id/raw", requireAuth, async (req: Request, res: Response) => {
  const id = paramId(req);
  const rows = await db
    .select()
    .from(uploadsTable)
    .where(eq(uploadsTable.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    res.status(404).json({ error: "Tidak ditemukan" });
    return;
  }
  const obj = await getObject(row.storageKey);
  if (!obj) {
    res.status(404).json({ error: "Berkas tidak ditemukan di storage" });
    return;
  }
  res.setHeader("Content-Type", row.contentType || obj.contentType);
  res.setHeader("Content-Length", String(obj.sizeBytes));
  res.setHeader("Cache-Control", "private, no-store");
  res.end(obj.body);
});

export default router;
