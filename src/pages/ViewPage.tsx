import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useDocumentManifest } from '../hooks/useDocumentManifest';
import { assetUrl } from '../utils/documentUtils';

export function ViewPage() {
  const { id } = useParams<{ id: string }>();
  const { documents, loading, error } = useDocumentManifest();
  const doc = documents.find((d) => d.id === id);

  useEffect(() => {
    document.title = doc?.title ?? 'View';
  }, [doc?.title]);

  if (loading) {
    return (
      <main className="page-shell">
        <p className="muted">Loading…</p>
      </main>
    );
  }

  if (error || !id) {
    return (
      <main className="page-shell">
        <p className="error-text">{error ?? 'Missing document id'}</p>
        <Link to="/">Back to list</Link>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="page-shell">
        <p className="error-text">Document not found: {id}</p>
        <Link to="/">Back to list</Link>
      </main>
    );
  }

  const htmlUrl = assetUrl(doc.htmlPath);
  const pdfUrl = doc.pdfPath ? assetUrl(doc.pdfPath) : null;

  return (
    <>
      <header className="view-toolbar">
        <Link to="/">Documents</Link>
        <span className="view-title">{doc.title}</span>
        <div className="view-toolbar-actions">
          <Link to={`/edit/${doc.id}`}>Edit</Link>
          {pdfUrl && (
            <a href={pdfUrl} download className="pdf-download-link">
              Download PDF
            </a>
          )}
        </div>
      </header>
      <iframe src={htmlUrl} title={doc.title} className="view-frame" />
    </>
  );
}
