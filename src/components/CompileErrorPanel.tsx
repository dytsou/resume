interface CompileErrorPanelProps {
  readonly error: string | null;
  readonly log: string | null;
}

export function CompileErrorPanel({ error, log }: CompileErrorPanelProps) {
  if (!error) return null;

  const excerpt = log?.slice(-2500) ?? error;

  return (
    <aside className="compile-error-panel" role="alert">
      <strong>Compile error</strong>
      <p>{error}</p>
      <pre className="compile-log">{excerpt}</pre>
    </aside>
  );
}
