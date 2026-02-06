export function DocumentList({ documents, onDelete, emptyMessage }) {
  if (documents.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="doc-list">
      {documents.map((doc) => (
        <div key={`doc-${doc._id}`} className="doc-item">
          <div className="doc-item__header">
            <span className="doc-item__title">{doc.title}</span>
            {onDelete && (
              <button
                className="btn btn--danger"
                onClick={() => onDelete(doc._id)}
              >
                Delete
              </button>
            )}
          </div>
          {doc.content && (
            <div className="doc-item__content">{doc.content}</div>
          )}
          <div className="doc-item__meta">
            {doc.category && <span>{doc.category}</span>}
            {doc.createdAt && (
              <span>
                {" "}
                &middot; {new Date(doc.createdAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
