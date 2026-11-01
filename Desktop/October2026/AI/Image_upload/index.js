const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const app = express();
const UPLOAD_DIR = path.join(__dirname, "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

/*
git rm -r --cached node_modules
git commit -m "Stop tracking node_modules"
*/

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // random name so users can't overwrite files or inject paths
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomBytes(16).toString("hex") + ext);
  },
});

const ALLOWED = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, GIF, or WebP images are allowed"));
  },
});

// Serve uploaded images publicly at /uploads/<filename>
app.use("/uploads", express.static(UPLOAD_DIR));

// Simple test page
app.get("/", (req, res) => {
  res.send(`
    <form action="/upload" method="POST" enctype="multipart/form-data">
      <input type="file" name="image" accept="image/*" required />
      <button type="submit">Upload</button>
    </form>
  `);
});

// "image" must match the form field name
app.post("/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  res.json({
    message: "Upload successful",
    filename: req.file.filename,
    size: req.file.size,
    url: `/uploads/${req.file.filename}`,
  });
});

// Error handler (file too large, wrong type, etc.)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message) {
    return res.status(400).json({ error: err.message });
  }
  res.status(500).json({ error: "Server error" });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));