# Local-First Database with Sync

A local-first database architecture where data is saved locally and continuously synced to a shared cloud database. Multiple users can connect to the same cloud CouchDB and collaborate through bidirectional replication.

## Architecture

```
┌──────────┐   save    ┌──────────────┐  push   ┌──────────────┐
│ Frontend │ ───────▶  │  Local Data  │ ──────▶ │              │
│  (React) │ ◀───────  │  (CouchDB)   │ ◀────── │  Cloud Data  │
└──────────┘   read    └──────────────┘  pull   │  (CouchDB)   │
                                                 │              │
┌──────────┐   save    ┌──────────────┐  push   │   Shared by  │
│ User B   │ ───────▶  │  User B's    │ ──────▶ │  all users   │
│ Frontend │ ◀───────  │  Local Data  │ ◀────── │              │
└──────────┘   read    └──────────────┘  pull   └──────────────┘
```

- **Frontend** — React UI to add, view, and manage documents
- **Local CouchDB** — Each user's local-first database; all reads/writes go here first
- **Backend** — Express API that manages bidirectional CouchDB replication
- **Cloud CouchDB** — Shared remote database that all users sync with

## Services

| Service        | Port  | Description                              |
|----------------|-------|------------------------------------------|
| Frontend       | 5173  | React UI (Vite dev server)               |
| Backend API    | 3001  | Express sync service                     |
| Local CouchDB  | 5984  | Local-first database (per user)          |
| Cloud CouchDB  | 5985  | Shared cloud database (host only)        |

## Quick Start (Host)

You are the **host** — you run the cloud CouchDB that others connect to.

```bash
# 1. Copy and configure your environment
cp .env.example .env
# Edit .env — set strong passwords and your HOST_ADDRESS

# 2. Start all services
docker compose up --build
```

Then open **http://localhost:5173** in your browser.

**Important:** Make sure port **5985** is accessible on your network (firewall/router settings) so other users can reach your cloud CouchDB.

## Quick Start (Consumer / Other Users)

You are a **consumer** — you connect to someone else's cloud CouchDB.

```bash
# 1. Copy and configure your environment
cp .env.consumer.example .env
# Edit .env — set CLOUD_HOST to the host's IP/domain,
# and CLOUD_COUCH_USER / CLOUD_COUCH_PASS to the shared credentials

# 2. Start using the consumer compose file
docker compose -f docker-compose.consumer.yml up --build
```

Then open **http://localhost:5173** in your browser.

## Environment Variables

### Host (.env)

| Variable           | Description                                | Default     |
|--------------------|--------------------------------------------|-------------|
| `LOCAL_COUCH_USER` | Local CouchDB admin username               | `admin`     |
| `LOCAL_COUCH_PASS` | Local CouchDB admin password               | `localpass` |
| `CLOUD_COUCH_USER` | Cloud CouchDB admin username               | `admin`     |
| `CLOUD_COUCH_PASS` | Cloud CouchDB admin password               | `cloudpass` |
| `DATABASE_NAME`    | Name of the shared database                | `app_data`  |
| `HOST_ADDRESS`     | Your machine's IP or domain for consumers  | `localhost` |

### Consumer (.env from .env.consumer.example)

| Variable           | Description                                | Example          |
|--------------------|--------------------------------------------|------------------|
| `LOCAL_COUCH_USER` | Your local CouchDB admin username          | `admin`          |
| `LOCAL_COUCH_PASS` | Your local CouchDB admin password          | `mypass`         |
| `CLOUD_COUCH_USER` | Cloud CouchDB username (from the host)     | `admin`          |
| `CLOUD_COUCH_PASS` | Cloud CouchDB password (from the host)     | `cloudpass`      |
| `CLOUD_HOST`       | Host's IP address or domain                | `192.168.1.50`   |
| `CLOUD_PORT`       | Host's cloud CouchDB port                  | `5985`           |
| `DATABASE_NAME`    | Name of the shared database                | `app_data`       |

## How It Works

1. You add data through the **Frontend** UI
2. Data is saved to your **Local CouchDB** via the Backend API
3. **Bidirectional continuous replication** syncs changes:
   - **Push:** Local → Cloud (your changes go to the shared database)
   - **Pull:** Cloud → Local (other users' changes come to you)
4. You can also trigger a **manual sync** from the UI

## Sync Modes

The backend supports three sync modes via the `SYNC_MODE` environment variable:

| Mode             | Description                                          |
|------------------|------------------------------------------------------|
| `bidirectional`  | Full two-way sync (default) — push and pull          |
| `push`           | One-way: Local → Cloud only                          |
| `pull`           | One-way: Cloud → Local only                          |

## API Endpoints

| Method   | Endpoint              | Description                    |
|----------|-----------------------|--------------------------------|
| `GET`    | `/api/health`         | Health check + sync status     |
| `GET`    | `/api/documents`      | List all local documents       |
| `GET`    | `/api/documents/:id`  | Get a single document          |
| `POST`   | `/api/documents`      | Create a new document          |
| `PUT`    | `/api/documents/:id`  | Update a document              |
| `DELETE` | `/api/documents/:id`  | Delete a document              |
| `POST`   | `/api/sync`           | Trigger manual bidirectional sync |
| `GET`    | `/api/sync/status`    | Get sync status + doc counts   |
| `GET`    | `/api/cloud/documents`| List cloud documents           |

## CouchDB Admin UIs

- Local: http://localhost:5984/_utils
- Cloud: http://localhost:5985/_utils (host only)

## Project Structure

```
├── docker-compose.yml              # Host setup (runs cloud + local + backend + frontend)
├── docker-compose.consumer.yml     # Consumer setup (local + backend + frontend, no cloud)
├── .env.example                    # Host environment template
├── .env.consumer.example           # Consumer environment template
├── couchdb-cloud.ini               # CouchDB CORS config for cloud instance
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── index.js                # Express API + bidirectional sync logic
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── styles/
        │   └── index.css
        └── components/
            ├── SyncStatusBar.jsx
            ├── DocumentForm.jsx
            └── DocumentList.jsx
```
