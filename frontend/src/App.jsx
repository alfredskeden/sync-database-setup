import { useState, useEffect, useCallback } from "react";
import { SyncStatusBar } from "./components/SyncStatusBar.jsx";
import { DocumentList } from "./components/DocumentList.jsx";

const API_BASE = "/api";

function App() {
  const [localDocs, setLocalDocs] = useState([]);
  const [cloudDocs, setCloudDocs] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchLocalDocs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/documents`);
      const data = await res.json();
      setLocalDocs(data);
    } catch (err) {
      console.error("Failed to fetch local docs:", err);
    }
  }, []);

  const fetchCloudDocs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/cloud/documents`);
      const data = await res.json();
      setCloudDocs(data);
    } catch (err) {
      console.error("Failed to fetch cloud docs:", err);
    }
  }, []);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/sync/status`);
      const data = await res.json();
      setSyncStatus(data);
    } catch (err) {
      console.error("Failed to fetch sync status:", err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchLocalDocs(), fetchCloudDocs(), fetchSyncStatus()]);
  }, [fetchLocalDocs, fetchCloudDocs, fetchSyncStatus]);

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, [refreshAll]);

  const handleDeleteDocument = useCallback(
    async (id) => {
      try {
        const res = await fetch(`${API_BASE}/documents/${id}`, {
          method: "DELETE",
        });

        if (!res.ok) throw new Error("Failed to delete document");

        await fetchLocalDocs();
        setTimeout(() => {
          fetchCloudDocs();
          fetchSyncStatus();
        }, 1500);
      } catch (err) {
        console.error("Failed to delete document:", err);
      }
    },
    [fetchLocalDocs, fetchCloudDocs, fetchSyncStatus],
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
