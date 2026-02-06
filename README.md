# Local-First Database with Sync

A local-first database architecture where data is saved locally and continuously synced to a cloud database that others can read from.

## Architecture

```
┌──────────┐   save    ┌──────────────┐   sync    ┌──────────┐   store   ┌───────────┐
│ Frontend │ ───────▶  │  Local Data  │ ───────▶  │ Backend  │ ───────▶  │   Cloud   │
│  (React) │ ◀───────  │  (CouchDB)   │ ◀───────  │ (Node.js)│ ◀───────  │ (CouchDB) │
└──────────┘   read    └──────────────┘           └──────────┘           └───────────┘
```

- **Frontend** — React UI to add, view, and manage documents
- **Local CouchDB** — Local-first database; all reads/writes go here first
- **Backend** — Express API that manages CouchDB replication from local to cloud
- **Cloud CouchDB** — Remote database that receives synced data for others to read

## Services

| Service        | Port  | Description                        |
|----------------|-------|------------------------------------|
| Frontend       | 5173  | React UI (Vite dev server)         |
| Backend API    | 3001  | Express sync service               |
| Local CouchDB  | 5984  | Local-first database               |
| Cloud CouchDB  | 5985  | Cloud database (simulated remote)  |

## Quick Start

```bash
docker compose up --build
```

Then open **http://localhost:5173** in your browser.

## How It Works

1. You add data through the **Frontend** UI
2. Data is saved to the **Local CouchDB** via the Backend API
3. CouchDB's built-in **continuous replication** syncs changes from Local → Cloud
4. The Cloud CouchDB now has the data available for other consumers
5. You can also trigger a manual sync from the UI

## API Endpoints

| Method   | Endpoint              | Description                    |
|----------|-----------------------|--------------------------------|
| `GET`    | `/api/health`         | Health check                   |
| `GET`    | `/api/documents`      | List all local documents       |
| `GET`    | `/api/documents/:id`  | Get a single document          |
| `POST`   | `/api/documents`      | Create a new document          |
| `PUT`    | `/api/documents/:id`  | Update a document              |
| `DELETE` | `/api/documents/:id`  | Delete a document              |
| `POST`   | `/api/sync`           | Trigger manual sync            |
| `GET`    | `/api/sync/status`    | Get sync status                |
| `GET`    | `/api/cloud/documents`| List cloud documents           |

## CouchDB Admin UIs

- Local: http://localhost:5984/_utils
- Cloud: http://localhost:5985/_utils

## Project Structure

```
├── docker-compose.yml       # Orchestrates all services
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── index.js         # Express API + sync logic
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
