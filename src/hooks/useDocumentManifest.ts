import { useEffect, useState } from 'react';

import {
  fetchDocumentManifest,
  type DocumentEntry,
} from '../utils/documentUtils';

export function useDocumentManifest() {
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDocumentManifest()
      .then((docs) => {
        if (!cancelled) setDocuments(docs);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { documents, loading, error };
}
