const Sidebar = ({
  myDocuments,
  sharedDocuments,
  selectedDocumentId,
  onSelect,
  onCreate,
  onUpload,
  onRename,
  onLogout,
  uploadLoading,
}) => {
  const promptRename = (doc) => {
    const nextTitle = window.prompt("New title", doc.title);
    if (nextTitle && nextTitle.trim()) {
      onRename(doc._id, nextTitle.trim());
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Documents</h2>
        <button onClick={onCreate}>+ New</button>
      </div>

      <label className="upload-btn">
        {uploadLoading ? "Uploading..." : "Upload .txt"}
        <input
          accept=".txt,text/plain"
          onChange={onUpload}
          type="file"
          disabled={uploadLoading}
        />
      </label>

      <section>
        <h3>My Documents</h3>
        <ul>
          {myDocuments.map((doc) => (
            <li
              key={doc._id}
              className={selectedDocumentId === doc._id ? "active" : ""}
            >
              <button className="doc-link" onClick={() => onSelect(doc._id)}>
                {doc.title}
              </button>
              <div className="doc-actions">
                <button onClick={() => promptRename(doc)}>Rename</button>
              </div>
            </li>
          ))}
          {!myDocuments.length && <li className="empty">No documents yet</li>}
        </ul>
      </section>

      <section>
        <h3>Shared Documents</h3>
        <ul>
          {sharedDocuments.map((doc) => (
            <li
              key={doc._id}
              className={selectedDocumentId === doc._id ? "active" : ""}
            >
              <button className="doc-link" onClick={() => onSelect(doc._id)}>
                {doc.title}
              </button>
            </li>
          ))}
          {!sharedDocuments.length && (
            <li className="empty">No shared documents</li>
          )}
        </ul>
      </section>

      <button className="logout-btn" onClick={onLogout}>
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;
