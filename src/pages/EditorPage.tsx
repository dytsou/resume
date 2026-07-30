import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { CompileErrorPanel } from '../components/CompileErrorPanel';
import { EditorLayout } from '../components/EditorLayout';
import { LatexEditor } from '../components/LatexEditor';
import { PublishPanel } from '../components/PublishPanel';
import { useDocumentManifest } from '../hooks/useDocumentManifest';
import { useLivePreview } from '../hooks/useLivePreview';
import {
  fetchDocumentSource,
  saveDocumentSource,
} from '../utils/documentUtils';
import { loadDraft, saveDraft } from '../utils/storage';

export function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { documents, loading: manifestLoading } = useDocumentManifest();
  const doc = documents.find((d) => d.id === id);

  const draft = id ? loadDraft(id) : null;
  const [source, setSource] = useState(() => draft ?? '');
  const [initialLoading, setInitialLoading] = useState(() =>
    Boolean(id && !draft)
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const filename = doc?.filename ?? `${id}.tex`;
  const { html, error, log, compiling, compileOk } = useLivePreview(
    source,
    filename,
    id ?? 'unknown'
  );

  useEffect(() => {
    document.title = doc ? `Edit — ${doc.title}` : 'Edit';
  }, [doc]);

  useEffect(() => {
    if (!id || loadDraft(id)) return;
    let cancelled = false;
    fetchDocumentSource(id)
      .then((text) => {
        if (!cancelled) setSource(text);
      })
      .catch((e: Error) => {
        if (!cancelled) setLoadError(e.message);
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !source) return;
    const timer = setTimeout(() => saveDraft(id, source), 400);
    return () => clearTimeout(timer);
  }, [id, source]);

  const handleSave = useCallback(async () => {
    if (!id || !compileOk) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      await saveDocumentSource(id, source);
      setSaveMessage(
        'Saved. Run pnpm run build to refresh published HTML/PDF.'
      );
    } catch (e) {
      setSaveMessage(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }, [id, source, compileOk]);

  if (!id) {
    return (
      <main className="page-shell">
        <p className="error-text">Missing document id</p>
      </main>
    );
  }

  if (manifestLoading || initialLoading) {
    return (
      <main className="page-shell">
        <p className="muted">Loading editor…</p>
      </main>
    );
  }

  if (loadError || !doc) {
    return (
      <main className="page-shell">
        <p className="error-text">{loadError ?? `Document not found: ${id}`}</p>
        <Link to="/">Back to list</Link>
      </main>
    );
  }

  return (
    <EditorLayout
      toolbar={
        <>
          <Link to="/">Documents</Link>
          <Link to={`/view/${id}`}>View</Link>
          <span className="view-title">{doc.title}</span>
          {compiling && <span className="muted">Compiling…</span>}
        </>
      }
      editor={<LatexEditor value={source} onChange={setSource} />}
      preview={
        html ? (
          <iframe
            title="Preview"
            className="preview-frame"
            srcDoc={html}
            sandbox="allow-scripts allow-forms allow-popups"
          />
        ) : (
          <p className="muted preview-placeholder">
            {compiling
              ? 'Compiling preview…'
              : 'Preview appears after a successful compile.'}
          </p>
        )
      }
      sidebar={
        <>
          <CompileErrorPanel error={error} log={log} />
          <PublishPanel
            canSave={compileOk}
            saving={saving}
            saveMessage={saveMessage}
            onSave={handleSave}
          />
        </>
      }
    />
  );
}
