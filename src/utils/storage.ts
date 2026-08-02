const draftKey = (id: string) => `latex-draft:${id}`;

export function loadDraft(id: string): string | null {
  try {
    return localStorage.getItem(draftKey(id));
  } catch {
    return null;
  }
}

export function saveDraft(id: string, content: string): void {
  localStorage.setItem(draftKey(id), content);
}

export function clearDraft(id: string): void {
  localStorage.removeItem(draftKey(id));
}
