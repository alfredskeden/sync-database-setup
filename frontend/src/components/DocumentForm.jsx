import { useState, useId } from "react";

export function DocumentForm({ onSubmit, isLoading }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");

  const titleId = useId();
  const contentId = useId();
  const categoryId = useId();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      category: category.trim() || "general",
      type: "document",
    });

    setTitle("");
    setContent("");
    setCategory("");
  };

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          className="input"
          type="text"
          placeholder="Document title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor={contentId}>Content</label>
        <textarea
          id={contentId}
          className="input"
          placeholder="Document content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label htmlFor={categoryId}>Category</label>
        <input
          id={categoryId}
          className="input"
          type="text"
          placeholder="e.g. notes, tasks, ideas..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      </div>

      <button
        type="submit"
        className="btn btn--primary"
        disabled={isLoading || !title.trim()}
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
