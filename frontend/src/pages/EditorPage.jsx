import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactQuill from "react-quill";
import apiClient from "../api/client";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

const EditorPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [myDocuments, setMyDocuments] = useState([]);
  const [sharedDocuments, setSharedDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [editorValue, setEditorValue] = useState("");
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [docVersion, setDocVersion] = useState(null);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("editor");
  const [shares, setShares] = useState([]);
  const [sharingBusy, setSharingBusy] = useState(false);
  const [lastSavedContent, setLastSavedContent] = useState("");

  const selectedDocumentId = selectedDocument?._id;

  const fetchLists = async () => {
    const [myRes, sharedRes] = await Promise.all([
      apiClient.get("/documents/my"),
      apiClient.get("/documents/shared"),
    ]);

    setMyDocuments(myRes.data);
    setSharedDocuments(sharedRes.data);
  };

  const fetchDocument = async (id) => {
    setLoadingDoc(true);
    try {
      const response = await apiClient.get(`/documents/${id}`);
      setSelectedDocument(response.data);
      const nextContent = response.data.content || "";
      setEditorValue(nextContent);
      setLastSavedContent(nextContent);
      setDocVersion(response.data.__v ?? null);
      setStatus("Loaded");

      if (response.data.permissions?.canShare) {
        await fetchShares(id);
      } else {
        setShares([]);
      }
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to load document");
    } finally {
      setLoadingDoc(false);
    }
  };

  const fetchShares = async (id) => {
    const response = await apiClient.get(`/documents/${id}/shares`);
    setShares(response.data || []);
  };

  const createDocument = async () => {
    const title = window.prompt("Document title", "Untitled Document");
    if (!title || !title.trim()) return;

    try {
      const response = await apiClient.post("/documents", {
        title: title.trim(),
      });
      await fetchLists();
      await fetchDocument(response.data._id);
    } catch (error) {
      setStatus(error.response?.data?.message || "Failed to create document");
    }
  };

  const renameDocument = async (id, title) => {
    try {
      await apiClient.put(`/documents/${id}`, { title });
      await fetchLists();
      if (selectedDocumentId === id) {
        await fetchDocument(id);
      }
      setStatus("Renamed");
    } catch (error) {
      setStatus(error.response?.data?.message || "Rename failed");
    }
  };

  const shareDocument = async () => {
    if (!selectedDocumentId) return;
    if (!shareEmail.trim()) {
      setStatus("Email is required for sharing");
      return;
    }

    setSharingBusy(true);
    try {
      await apiClient.post(`/documents/${selectedDocumentId}/share`, {
        email: shareEmail.trim(),
        role: shareRole,
      });
      setShareEmail("");
      await fetchDocument(selectedDocumentId);
      setStatus("Sharing updated");
    } catch (error) {
      setStatus(error.response?.data?.message || "Share failed");
    } finally {
      setSharingBusy(false);
    }
  };

  const updateShareRole = async (userId, role) => {
    if (!selectedDocumentId) return;
    setSharingBusy(true);
    try {
      await apiClient.patch(
        `/documents/${selectedDocumentId}/shares/${userId}`,
        { role },
      );
      await fetchShares(selectedDocumentId);
      setStatus("Role updated");
    } catch (error) {
      setStatus(error.response?.data?.message || "Role update failed");
    } finally {
      setSharingBusy(false);
    }
  };

  const revokeShare = async (userId) => {
    if (!selectedDocumentId) return;
    setSharingBusy(true);
    try {
      await apiClient.delete(
        `/documents/${selectedDocumentId}/shares/${userId}`,
      );
      await fetchShares(selectedDocumentId);
      setStatus("Access revoked");
    } catch (error) {
      setStatus(error.response?.data?.message || "Revoke failed");
    } finally {
      setSharingBusy(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name.replace(/\.txt$/i, ""));

    setUploadLoading(true);
    try {
      const response = await apiClient.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await fetchLists();
      await fetchDocument(response.data._id);
      setStatus("File imported as document");
    } catch (error) {
      setStatus(error.response?.data?.message || "Upload failed");
    } finally {
      setUploadLoading(false);
      event.target.value = "";
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        await fetchLists();
      } catch (error) {
        setStatus("Failed to fetch documents");
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (!selectedDocumentId) return;
    if (editorValue === lastSavedContent) return;

    const timeoutId = setTimeout(async () => {
      try {
        await apiClient.put(`/documents/${selectedDocumentId}`, {
          content: editorValue,
          version: docVersion,
        });
        const latest = await apiClient.get(`/documents/${selectedDocumentId}`);
        setDocVersion(latest.data.__v ?? null);
        setLastSavedContent(editorValue);
        setStatus("Saved");
      } catch (error) {
        if (error.response?.status === 409) {
          setStatus("Conflict detected. Reloaded newest version.");
          await fetchDocument(selectedDocumentId);
        } else {
          setStatus(error.response?.data?.message || "Autosave failed");
        }
      }
    }, 900);

    return () => clearTimeout(timeoutId);
  }, [editorValue, selectedDocumentId, docVersion, lastSavedContent]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const subtitle = useMemo(() => {
    if (!selectedDocument) return "Select or create a document";
    return `Editing: ${selectedDocument.title}`;
  }, [selectedDocument]);

  return (
    <div className="app-shell">
      <Sidebar
        myDocuments={myDocuments}
        sharedDocuments={sharedDocuments}
        selectedDocumentId={selectedDocumentId}
        onSelect={fetchDocument}
        onCreate={createDocument}
        onUpload={handleUpload}
        onRename={renameDocument}
        onLogout={onLogout}
        uploadLoading={uploadLoading}
      />

      <main className="editor-panel">
        <header>
          <h1>Welcome, {user?.name || user?.email}</h1>
          <p>{subtitle}</p>
          {status && <small>{status}</small>}
        </header>

        {loadingDoc && <p>Loading document...</p>}

        {!selectedDocument && !loadingDoc && (
          <div className="empty-editor">
            Pick a doc from the left or create one.
          </div>
        )}

        {selectedDocument && (
          <>
            <ReactQuill
              theme="snow"
              value={editorValue}
              onChange={setEditorValue}
              placeholder="Start typing..."
              className="quill"
            />

            {selectedDocument.permissions?.canShare && (
              <section className="sharing-panel">
                <h3>Share Document</h3>
                <div className="share-form">
                  <input
                    type="email"
                    value={shareEmail}
                    placeholder="teammate@example.com"
                    onChange={(event) => setShareEmail(event.target.value)}
                  />
                  <select
                    value={shareRole}
                    onChange={(event) => setShareRole(event.target.value)}
                  >
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button
                    type="button"
                    onClick={shareDocument}
                    disabled={sharingBusy}
                  >
                    Share
                  </button>
                </div>

                <ul className="share-list">
                  {shares.map((entry) => (
                    <li key={entry.userId?._id || entry.userId}>
                      <span>{entry.userId?.email || "Unknown user"}</span>
                      <select
                        value={entry.role}
                        onChange={(event) =>
                          updateShareRole(
                            entry.userId?._id || entry.userId,
                            event.target.value,
                          )
                        }
                        disabled={sharingBusy}
                      >
                        <option value="editor">Editor</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          revokeShare(entry.userId?._id || entry.userId)
                        }
                        disabled={sharingBusy}
                      >
                        Revoke
                      </button>
                    </li>
                  ))}
                  {!shares.length && <li>No collaborators yet</li>}
                </ul>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default EditorPage;
