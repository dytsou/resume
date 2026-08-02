import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { useDocumentManifest } from '../hooks/useDocumentManifest';

export function DocumentListPage() {
  const { documents, loading, error } = useDocumentManifest();

  useEffect(() => {
    document.title = 'Documents';
  }, []);

  if (loading) {
    return (
      <main className="page-shell">
        <p className="muted">Loading documents…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-shell">
        <p className="error-text">Failed to load manifest: {error}</p>
      </main>
    );
  }

  if (documents.length === 0) {
    return (
      <main className="page-shell">
        <h1>Documents</h1>
        <p className="muted">
          No converted documents yet. Run <code>pnpm run convert</code>.
        </p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <h1>Documents</h1>
      <ul className="doc-list">
        {documents.map((doc) => (
          <li key={doc.id} className="doc-list-item">
            <div>
              <strong>{doc.title}</strong>
              <span className="muted"> — {doc.author}</span>
            </div>
            <div className="doc-list-actions">
              <Link to={`/view/${doc.id}`}>View</Link>
              <Link to={`/edit/${doc.id}`}>Edit</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
