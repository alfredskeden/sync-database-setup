import { useState, useEffect, useCallback, useId } from "react";
import { SyncStatusBar } from "./components/SyncStatusBar.jsx";
import { DocumentForm } from "./components/DocumentForm.jsx";
import { DocumentList } from "./components/DocumentList.jsx";

const API_BASE = "/api";
const CLOUD_ONLY = import.meta.env.VITE_CLOUD_ONLY === "true";

function App() {
  const [localDocs, setLocalDocs] = useState([]);
  const [cloudDocs, setCloudDocs] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const data = await res.json();
      if (CLOUD_ONLY) {
        setCloudDocs(data);
      } else {
        setLocalDocs(data);
      }
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  }, []);

  const fetchCloudDocs = useCallback(async () => {
    if (CLOUD_ONLY) return; // In cloud-only mode, /api/documents already returns cloud docs
    try {
      const res = await fetch(`${API_BASE}/cloud/documents`);
      const data = await res.json();
      setCloudDocs(data);
    } catch (err) {
      console.error("Failed to fetch cloud docs:", err);
    }
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    if (CLOUD_ONLY) return;
    try {
      const res = await fetch(`${API_BASE}/sync/status`);
      const data = await res.json();
      setSyncStatus(data);
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchDocs(), fetchCloudDocs(), fetchSyncStatus()]);
  }, [fetchDocs, fetchCloudDocs, fetchSyncStatus]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const handleAddDocument = useCallback(
    async (doc) => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doc),
        });

        if (!res.ok) throw new Error("Failed to create document");

        if (CLOUD_ONLY) {
          await fetchDocs();
        } else {
          // Refresh local docs immediately, cloud after a delay (replication takes a moment)
          await fetchDocs();
          setTimeout(() => {
            fetchCloudDocs();
            fetchSyncStatus();
          }, 1500);
        }
      } catch (err) {
        console.error("Failed to add document:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchDocs, fetchCloudDocs, fetchSyncStatus],
  );

  const handleDeleteDocument = useCallback(
    async (id) => {
      try {
        const res = await fetch(`${API_BASE}/documents/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to delete document");

        if (CLOUD_ONLY) {
          await fetchDocs();
        } else {
          await fetchDocs();
          setTimeout(() => {
            fetchCloudDocs();
            fetchSyncStatus();
          }, 1500);
        }
      } catch (err) {
        console.error("Failed to delete document:", err);
      }
    },
    [fetchDocs, fetchCloudDocs, fetchSyncStatus],
  );

  const handleManualSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      await fetch(`${API_BASE}/sync`, { method: "POST" });
      await refreshAll();
    } catch (err) {
      console.error("Failed to trigger sync:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [refreshAll]);

  if (CLOUD_ONLY) {
    return (
      <div className="app">
        <header className="app-header">
          <h1>Cloud Database</h1>
          <p>Cloud documents</p>
        </header>
        <div className="layout layout--single">
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                <span className="badge badge--cloud">Cloud</span>
                Documents ({cloudDocs.length})
              </span>
            </div>
            <DocumentList
              documents={cloudDocs}
              onDelete={handleDeleteDocument}
              emptyMessage="No documents yet. Add one above."
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Local-First Database</h1>
        <p>Save locally, sync to cloud, share with others</p>
      </header>

      <SyncStatusBar
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        onSync={handleManualSync}
      />

      <DocumentForm onSubmit={handleAddDocument} isLoading={isLoading} />

      <div className="layout">
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span className="badge badge--local">Local</span>
              Local Documents ({localDocs.length})
            </span>
          </div>
          <DocumentList
            documents={localDocs}
            onDelete={handleDeleteDocument}
            emptyMessage="No local documents yet. Add one above."
          />
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              <span className="badge badge--cloud">Cloud</span>
              Cloud Documents ({cloudDocs.length})
            </span>
          </div>
          <DocumentList
            documents={cloudDocs}
            emptyMessage="No cloud documents yet. Documents will appear here after sync."
          />
        </div>
      </div>
    </div>
  );
}

export default App;
