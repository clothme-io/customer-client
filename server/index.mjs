import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { dbUnavailableResponse, hasDatabase, query } from "./db.mjs";
import { requireAdmin } from "./auth.mjs";
import { archivePost, getPostById, getPostBySlug, listPosts, savePost } from "./posts.mjs";
import { uploadToBunny } from "./bunny.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: "1mb" }));

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

function requireDb(req, res, next) {
  if (!hasDatabase()) {
    return dbUnavailableResponse(res);
  }
  return next();
}

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    database: hasDatabase(),
    bunny: Boolean(process.env.BUNNY_STORAGE_ZONE && process.env.BUNNY_CDN_BASE_URL),
    clerk: Boolean(process.env.CLERK_SECRET_KEY)
  });
});

app.post(
  "/api/waitlist",
  requireDb,
  asyncHandler(async (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const source = String(req.body.source || "").slice(0, 120);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Valid email is required" });
    }

    await query(
      `insert into waitlist_signups (email, source)
       values ($1, $2)
       on conflict (email) do nothing`,
      [email, source]
    );

    return res.status(201).json({ ok: true });
  })
);

app.get(
  "/api/posts",
  requireDb,
  asyncHandler(async (req, res) => {
    const posts = await listPosts({ admin: false });
    res.json({ posts });
  })
);

app.get(
  "/api/posts/:slug",
  requireDb,
  asyncHandler(async (req, res) => {
    const post = await getPostBySlug(req.params.slug, { previewToken: req.query.previewToken || "" });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    return res.json({ post });
  })
);

app.get(
  "/api/admin/posts",
  requireAdmin,
  requireDb,
  asyncHandler(async (req, res) => {
    const posts = await listPosts({ admin: true });
    res.json({ posts });
  })
);

app.get(
  "/api/admin/posts/:id",
  requireAdmin,
  requireDb,
  asyncHandler(async (req, res) => {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ error: "Post not found" });
    return res.json({ post });
  })
);

app.post(
  "/api/admin/posts",
  requireAdmin,
  requireDb,
  asyncHandler(async (req, res) => {
    const post = await savePost(req.body, req.admin.email);
    res.status(201).json({ post });
  })
);

app.put(
  "/api/admin/posts/:id",
  requireAdmin,
  requireDb,
  asyncHandler(async (req, res) => {
    const post = await savePost({ ...req.body, id: req.params.id }, req.admin.email);
    res.json({ post });
  })
);

app.delete(
  "/api/admin/posts/:id",
  requireAdmin,
  requireDb,
  asyncHandler(async (req, res) => {
    await archivePost(req.params.id, req.admin.email);
    res.json({ ok: true });
  })
);

app.post(
  "/api/admin/posts/:id/publish",
  requireAdmin,
  requireDb,
  asyncHandler(async (req, res) => {
    const existing = await getPostById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Post not found" });
    const post = await savePost({ ...existing, status: "published", publishedAt: new Date().toISOString(), scheduledFor: null }, req.admin.email);
    res.json({ post });
  })
);

app.post(
  "/api/admin/posts/:id/schedule",
  requireAdmin,
  requireDb,
  asyncHandler(async (req, res) => {
    const existing = await getPostById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Post not found" });
    const post = await savePost({ ...existing, status: "scheduled", scheduledFor: req.body.scheduledFor }, req.admin.email);
    res.json({ post });
  })
);

app.post(
  "/api/admin/upload",
  requireAdmin,
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }
    const url = await uploadToBunny(req.file);
    return res.status(201).json({ url });
  })
);

const distDir = path.join(rootDir, "dist");
app.use(express.static(distDir));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: error.message || "Server error" });
});

app.listen(port, () => {
  console.log(`ClothME server listening on http://127.0.0.1:${port}`);
});
