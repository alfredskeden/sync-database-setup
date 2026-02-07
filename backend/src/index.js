import express from "express";
import cors from "cors";
import nano from "nano";

const app = express();
const PORT = process.env.PORT || 3001;

const CLOUD_ONLY = process.env.CLOUD_ONLY === "true";
const LOCAL_COUCHDB_URL =
  process.env.LOCAL_COUCHDB_URL || "http://admin:localpass@localhost:5984";
const CLOUD_COUCHDB_URL =
  process.env.CLOUD_COUCHDB_URL || "http://admin:cloudpass@localhost:5985";
const DATABASE_NAME = process.env.DATABASE_NAME || "app_data";
const SYNC_MODE = CLOUD_ONLY ? "none" : (process.env.SYNC_MODE || "bidirectional"); // "push" | "pull" | "bidirectional" | "none"

const localCouch = CLOUD_ONLY ? null : nano(LOCAL_COUCHDB_URL);
const cloudCouch = nano(CLOUD_COUCHDB_URL);

let localDb;
let cloudDb;
// In cloud-only mode, primaryDb points to cloudDb; otherwise it points to localDb
let primaryDb;
let replicationStatus = {
  pushActive: false,
  pullActive: false,
};

// ─── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Database Initialization ───────────────────────────────────────
async function initializeDatabases() {
  try {
    if (!CLOUD_ONLY) {
      // Create local database if it doesn't exist
      try {
        await localCouch.db.create(DATABASE_NAME);
        console.log(`[Local] Created database: ${DATABASE_NAME}`);
      } catch (err) {
        if (err.statusCode === 412) {
          console.log(`[Local] Database already exists: ${DATABASE_NAME}`);
        } else {
          throw err;
        }
      }
      localDb = localCouch.db.use(DATABASE_NAME);
    }

    // Create cloud database if it doesn't exist
    try {
      await cloudCouch.db.create(DATABASE_NAME);
      console.log(`[Cloud] Created database: ${DATABASE_NAME}`);
    } catch (err) {
      if (err.statusCode === 412) {
        console.log(`[Cloud] Database already exists: ${DATABASE_NAME}`);
      } else {
        throw err;
      }
    }

    cloudDb = cloudCouch.db.use(DATABASE_NAME);

    // In cloud-only mode, all operations go directly to the cloud database
    primaryDb = CLOUD_ONLY ? cloudDb : localDb;

    console.log(`Databases initialized successfully (cloud-only: ${CLOUD_ONLY})`);
  } catch (err) {
    console.error("Failed to initialize databases:", err.message);
    process.exit(1);
  }
}

// ─── Replication ───────────────────────────────────────────────────

async function startPushReplication() {
  if (replicationStatus.pushActive) {
    console.log("Push replication already active");
    return;
  }

  try {
    await localCouch.db.replicate(
      DATABASE_NAME,
      `${CLOUD_COUCHDB_URL}/${DATABASE_NAME}`,
      { continuous: true, create_target: true }
    );

    replicationStatus.pushActive = true;
    console.log("Continuous replication started: Local → Cloud");
  } catch (err) {
    console.error("Failed to start push replication:", err.message);
  }
}

async function startPullReplication() {
  if (replicationStatus.pullActive) {
    console.log("Pull replication already active");
    return;
  }

  try {
    await localCouch.db.replicate(
      `${CLOUD_COUCHDB_URL}/${DATABASE_NAME}`,
      DATABASE_NAME,
      { continuous: true, create_target: true }
    );

    replicationStatus.pullActive = true;
    console.log("Continuous replication started: Cloud → Local");
  } catch (err) {
    console.error("Failed to start pull replication:", err.message);
  }
}

async function startReplication() {
  if (SYNC_MODE === "push" || SYNC_MODE === "bidirectional") {
    await startPushReplication();
  }

  if (SYNC_MODE === "pull" || SYNC_MODE === "bidirectional") {
    await startPullReplication();
  }

  console.log(`Sync mode: ${SYNC_MODE}`);
}

// ─── Manual Sync Trigger ───────────────────────────────────────────
async function triggerSync() {
  try {
    // Push: Local → Cloud
    const pushResult = await localCouch.db.replicate(
      DATABASE_NAME,
      `${CLOUD_COUCHDB_URL}/${DATABASE_NAME}`,
      { create_target: true }
    );

    // Pull: Cloud → Local
    const pullResult = await localCouch.db.replicate(
      `${CLOUD_COUCHDB_URL}/${DATABASE_NAME}`,
      DATABASE_NAME,
      { create_target: true }
    );

    return { push: pushResult, pull: pullResult };
  } catch (err) {
    console.error("Sync failed:", err.message);
    throw err;
  }
}

// ─── API Routes ────────────────────────────────────────────────────

// Health check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    cloudOnly: CLOUD_ONLY,
    syncMode: SYNC_MODE,
    replicationStatus,
    timestamp: new Date().toISOString(),
  });
});

// Get all documents from the primary database (local or cloud)
app.get("/api/documents", async (_req, res) => {
  try {
    const result = await primaryDb.list({ include_docs: true });
    const docs = result.rows
      .filter((row) => !row.id.startsWith("_"))
      .map((row) => row.doc);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get a single document
app.get("/api/documents/:id", async (req, res) => {
  try {
    const doc = await primaryDb.get(req.params.id);
    res.json(doc);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

// Create a new document (saves to primary database)
app.post("/api/documents", async (req, res) => {
  try {
    const doc = {
      ...req.body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const result = await primaryDb.insert(doc);
    const created = await primaryDb.get(result.id);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a document
app.put("/api/documents/:id", async (req, res) => {
  try {
    const existing = await primaryDb.get(req.params.id);
    const updated = {
      ...existing,
      ...req.body,
      _id: existing._id,
      _rev: existing._rev,
      updatedAt: new Date().toISOString(),
    };
    const result = await primaryDb.insert(updated);
    const doc = await primaryDb.get(result.id);
    res.json(doc);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete a document
app.delete("/api/documents/:id", async (req, res) => {
  try {
    const doc = await primaryDb.get(req.params.id);
    await primaryDb.destroy(doc._id, doc._rev);
    res.json({ ok: true, id: doc._id });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(500).json({ error: err.message });
  }
});

// Trigger manual sync (only available when not in cloud-only mode)
app.post("/api/sync", async (_req, res) => {
  if (CLOUD_ONLY) {
    return res.json({ ok: true, message: "Cloud-only mode — no sync needed" });
  }
  try {
    const result = await triggerSync();
    res.json({ ok: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get sync status
app.get("/api/sync/status", async (_req, res) => {
  try {
    const cloudInfo = await cloudCouch.db.get(DATABASE_NAME);

    if (CLOUD_ONLY) {
      return res.json({
        cloudOnly: true,
        syncMode: SYNC_MODE,
        replicationStatus,
        cloud: {
          docCount: cloudInfo.doc_count,
          updateSeq: cloudInfo.update_seq,
        },
        inSync: true,
      });
    }

    const localInfo = await localCouch.db.get(DATABASE_NAME);

    res.json({
      cloudOnly: false,
      syncMode: SYNC_MODE,
      replicationStatus,
      local: {
        docCount: localInfo.doc_count,
        updateSeq: localInfo.update_seq,
      },
      cloud: {
        docCount: cloudInfo.doc_count,
        updateSeq: cloudInfo.update_seq,
      },
      inSync: localInfo.doc_count === cloudInfo.doc_count,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get documents from cloud database (what others see)
app.get("/api/cloud/documents", async (_req, res) => {
  try {
    const result = await cloudDb.list({ include_docs: true });
    const docs = result.rows
      .filter((row) => !row.id.startsWith("_"))
      .map((row) => row.doc);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start Server ──────────────────────────────────────────────────
async function start() {
  await initializeDatabases();

  if (!CLOUD_ONLY) {
    await startReplication();
  }

  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    if (CLOUD_ONLY) {
      console.log(`Mode: Cloud-only`);
      console.log(`Cloud CouchDB: ${CLOUD_COUCHDB_URL}`);
    } else {
      console.log(`Local CouchDB: ${LOCAL_COUCHDB_URL}`);
      console.log(`Cloud CouchDB: ${CLOUD_COUCHDB_URL}`);
      console.log(`Sync mode: ${SYNC_MODE}`);
    }
  });
}

start();
