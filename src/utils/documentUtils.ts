export interface DocumentEntry {
  id: string;
  filename: string;
  title: string;
  author: string;
  date: string;
  htmlPath: string;
  pdfPath?: string;
  lastConverted: string;
}

/** Resolve a manifest-relative path against Vite base URL. */
export function assetUrl(relativePath: string): string {
  const base = import.meta.env.BASE_URL;
  const path = relativePath.replace(/^\//, '');
  return `${base}${path}`;
}

/** Fetch the documents manifest generated during convert. */
export async function fetchDocumentManifest(): Promise<DocumentEntry[]> {
  const url = assetUrl('documents-manifest.json');
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load manifest (${res.status})`);
  }
  const data = (await res.json()) as DocumentEntry[];
  return Array.isArray(data) ? data : [];
}

/** Dev-only: load LaTeX source from compile server. */
export async function fetchDocumentSource(id: string): Promise<string> {
  const res = await fetch(`/api/documents/${encodeURIComponent(id)}`);
  if (!res.ok) {
    throw new Error(`Document not found: ${id}`);
  }
  const data = (await res.json()) as { source: string };
  return data.source;
}

/** Dev-only: save LaTeX source to latex/{id}.tex */
export async function saveDocumentSource(
  id: string,
  source: string
): Promise<void> {
  const res = await fetch(`/api/documents/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source }),
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? `Save failed (${res.status})`);
  }
}
