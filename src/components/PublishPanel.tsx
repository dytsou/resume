interface PublishPanelProps {
  readonly canSave: boolean;
  readonly saving: boolean;
  readonly saveMessage: string | null;
  readonly onSave: () => void;
}

export function PublishPanel({
  canSave,
  saving,
  saveMessage,
  onSave,
}: PublishPanelProps) {
  return (
    <aside className="publish-panel">
      <h2>Publish</h2>
      <ol className="publish-steps">
        <li>Fix compile errors until preview succeeds.</li>
        <li>
          Save writes <code>latex/&#123;id&#125;.tex</code> (dev only).
        </li>
        <li>
          Run <code>pnpm run build</code> then deploy.
        </li>
      </ol>
      <button
        type="button"
        className="primary-button"
        disabled={!canSave || saving}
        onClick={onSave}
      >
        {saving ? 'Saving…' : 'Save to repo'}
      </button>
      {saveMessage && <p className="muted">{saveMessage}</p>}
    </aside>
  );
}
