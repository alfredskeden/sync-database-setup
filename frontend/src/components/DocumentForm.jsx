import { useId, useState } from "react";

const CLOUD_ONLY = process.env.CLOUD_ONLY === "true";

export function DocumentForm({ onSubmit, isLoading }) {
  if (CLOUD_ONLY) {
    return null;
  }

  const [author, setAuthor] = useState("");
  const [text, setText] = useState("");
  const [posX, setPosX] = useState("");
  const [posY, setPosY] = useState("");
  const [posZ, setPosZ] = useState("");

  const authorFieldId = useId();
  const textFieldId = useId();
  const posXId = useId();
  const posYId = useId();
  const posZId = useId();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const now = Date.now();
    const docId = `pi-${now.toString(16)}-${Math.random().toString(16).slice(2, 15)}`;

    await onSubmit({
      id: docId,
      author: author.trim() || docId.split("-").slice(0, 3).join("-"),
      time: now,
      pos: {
        x: parseFloat(posX) || 0,
        y: parseFloat(posY) || 0,
        z: parseFloat(posZ) || 0,
      },
      text: text.trim(),
    });

    setText("");
    setPosX("");
    setPosY("");
    setPosZ("");
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor={authorFieldId}>Author</label>
        <input
          id={authorFieldId}
          className="input"
          type="text"
          placeholder="Author ID (auto-generated if empty)..."
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label htmlFor={textFieldId}>Text</label>
        <input
          id={textFieldId}
          className="input"
          type="text"
          placeholder="Message text..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </div>

      <fieldset className="form-group" style={{ border: "1px solid var(--border, #e2e8f0)", borderRadius: "8px", padding: "12px" }}>
        <legend style={{ fontSize: "0.875rem", fontWeight: 500 }}>Position</legend>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          <div>
            <label htmlFor={posXId} style={{ fontSize: "0.75rem" }}>X</label>
            <input
              id={posXId}
              className="input"
              type="number"
              step="any"
              placeholder="0"
              value={posX}
              onChange={(e) => setPosX(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={posYId} style={{ fontSize: "0.75rem" }}>Y</label>
            <input
              id={posYId}
              className="input"
              type="number"
              step="any"
              placeholder="0"
              value={posY}
              onChange={(e) => setPosY(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor={posZId} style={{ fontSize: "0.75rem" }}>Z</label>
            <input
              id={posZId}
              className="input"
              type="number"
              step="any"
              placeholder="0"
              value={posZ}
              onChange={(e) => setPosZ(e.target.value)}
            />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        className="btn btn--primary"
        disabled={isLoading || !text.trim()}
      >
        {isLoading ? (
          <>
            <span className="spinner" />
            Saving...
          </>
        ) : (
          "Save to Local Database"
        )}
      </button>
    </form>
  );
}
