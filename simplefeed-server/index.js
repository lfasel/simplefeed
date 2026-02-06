import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";

const db = new Database("photos.db");

// Create table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS photos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    caption TEXT NOT NULL,
    createdAt TEXT NOT NULL
  )
`);

function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
  if (!cols.includes(column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

addColumnIfMissing("photos", "takenAt", "TEXT");
addColumnIfMissing("photos", "lat", "REAL");
addColumnIfMissing("photos", "lon", "REAL");
addColumnIfMissing("photos", "locationName", "TEXT");

const app = express();
app.use(cors());
app.use(express.json());

const uploadDir = path.resolve("./uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // keep original extension
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  },
});

const upload = multer({ storage });

function safeUnlink(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (e) {
    // If file doesn't exist, we don't want to crash
    if (e.code !== "ENOENT") throw e;
  }
}

// Serve images
app.use("/uploads", express.static(uploadDir));

app.post("/api/photos", upload.single("image"), (req, res) => {
  const caption = req.body.caption ?? "";
  const createdAt = new Date().toISOString();

  const takenAt = req.body.takenAt || null;
  const lat = req.body.lat ? Number(req.body.lat) : null;
  const lon = req.body.lon ? Number(req.body.lon) : null;
  const locationName = req.body.locationName || null;

  const stmt = db.prepare(`
    INSERT INTO photos (filename, caption, createdAt, takenAt, lat, lon, locationName)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    req.file.filename,
    caption,
    createdAt,
    takenAt,
    Number.isFinite(lat) ? lat : null,
    Number.isFinite(lon) ? lon : null,
    locationName
  );

  res.json({
    id: info.lastInsertRowid,
    url: `/uploads/${req.file.filename}`,
    caption,
    createdAt,
    takenAt,
    lat,
    lon,
    locationName,
  });
});

app.get("/api/photos", (req, res) => {
  const rows = db.prepare(`
    SELECT id, filename, caption, createdAt, takenAt, lat, lon, locationName
    FROM photos
    ORDER BY id DESC
  `).all();

  res.json(rows.map(r => ({
    id: r.id,
    url: `/uploads/${r.filename}`,
    caption: r.caption,
    createdAt: r.createdAt,
    takenAt: r.takenAt,
    lat: r.lat,
    lon: r.lon,
    locationName: r.locationName,
  })));
});

app.delete("/api/photos/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  // 1) find row
  const row = db
    .prepare("SELECT id, filename FROM photos WHERE id = ?")
    .get(id);

  if (!row) return res.status(404).json({ error: "Not found" });

  // 2) delete DB row
  db.prepare("DELETE FROM photos WHERE id = ?").run(id);

  // 3) delete file from disk
  const filePath = path.join(uploadDir, row.filename);
  safeUnlink(filePath);

  // 4) return ok
  res.json({ ok: true });
});

app.put("/api/photos/:id", upload.single("image"), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "Invalid id" });

  const existing = db.prepare("SELECT id, filename FROM photos WHERE id = ?").get(id);
  if (!existing) return res.status(404).json({ error: "Not found" });

  const caption = req.body.caption ?? "";
  const takenAt = req.body.takenAt || null;
  const locationName = req.body.locationName || null;

  const lat = req.body.lat ? Number(req.body.lat) : null;
  const lon = req.body.lon ? Number(req.body.lon) : null;

  // If user uploaded a replacement file, use it; otherwise keep old filename
  const newFilename = req.file?.filename ?? existing.filename;

  db.prepare(`
    UPDATE photos
    SET filename = ?, caption = ?, takenAt = ?, lat = ?, lon = ?, locationName = ?
    WHERE id = ?
  `).run(
    newFilename,
    caption,
    takenAt,
    Number.isFinite(lat) ? lat : null,
    Number.isFinite(lon) ? lon : null,
    locationName,
    id
  );

  // If replaced image, delete old file
  if (req.file?.filename && req.file.filename !== existing.filename) {
    const oldPath = path.join(uploadDir, existing.filename);
    try { fs.unlinkSync(oldPath); } catch (e) { if (e.code !== "ENOENT") throw e; }
  }

  res.json({ ok: true });
});


app.listen(4000, () => console.log("API running on http://localhost:4000"));
