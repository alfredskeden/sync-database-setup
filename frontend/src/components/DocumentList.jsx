export function DocumentList({ documents, onDelete, emptyMessage }) {
  if (documents.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="doc-list">
      {documents.map((doc) => (
        <div key={`doc-${doc._id}`} className="doc-item">
          <div className="doc-item__header">
            <span className="doc-item__title">{doc.text || doc.title || doc.id}</span>
            {onDelete && (
              <button
                className="btn btn--danger"
                onClick={() => onDelete(doc._id)}
              >
                Delete
              </button>
            )}
          </div>
          <div className="doc-item__meta">
            {doc.author && <span>Author: {doc.author}</span>}
            {doc.time && (
              <span>
                {" "}
                &middot; {new Date(doc.time).toLocaleString()}
              </span>
            )}
          </div>
          {doc.pos && (
            <div className="doc-item__meta" style={{ fontSize: "0.8em", opacity: 0.7 }}>
              <span>
                Pos: ({doc.pos.x?.toFixed(2)}, {doc.pos.y?.toFixed(2)}, {doc.pos.z?.toFixed(2)})
              </span>
            </div>
          )}
          {/* Fallback for old document format */}
          {doc.content && (
            <div className="doc-item__content">{doc.content}</div>
          )}
          {doc.category && !doc.pos && (
            <div className="doc-item__meta">
              <span>{doc.category}</span>
              {doc.createdAt && (
                <span>
                  {" "}
                  &middot; {new Date(doc.createdAt).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
