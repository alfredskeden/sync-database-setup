export function SyncStatusBar({ syncStatus, isSyncing, onSync }) {
  const inSync = syncStatus?.inSync ?? false;

  return (
    <div className="sync-bar">
      <div className="sync-bar__info">
        <div className="sync-bar__stat">
          <span>Status</span>
          <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              className={`sync-indicator ${
                inSync
                  ? "sync-indicator--synced"
                  : "sync-indicator--unsynced"
              }`}
            />
            {inSync ? "In Sync" : "Pending"}
          </strong>
        </div>

        <div className="sync-bar__stat">
          <span>Local Docs</span>
          <strong>{syncStatus?.local?.docCount ?? "..."}</strong>
        </div>

        <div className="sync-bar__stat">
          <span>Cloud Docs</span>
          <strong>{syncStatus?.cloud?.docCount ?? "..."}</strong>
        </div>

        <div className="sync-bar__stat">
          <span>Replication</span>
          <strong>
            {syncStatus?.replicationActive ? "Active" : "Inactive"}
          </strong>
        </div>
      </div>

      <button
        className="btn btn--sync"
        onClick={onSync}
        disabled={isSyncing}
      >
        {isSyncing ? (
          <>
            <span className="spinner" />
            Syncing...
          </>
        ) : (
          "Sync Now"
        )}
      </button>
    </div>
  );
}
