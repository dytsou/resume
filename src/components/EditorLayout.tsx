import type { ReactNode } from 'react';

interface EditorLayoutProps {
  readonly toolbar: ReactNode;
  readonly editor: ReactNode;
  readonly preview: ReactNode;
  readonly sidebar?: ReactNode;
}

export function EditorLayout({
  toolbar,
  editor,
  preview,
  sidebar,
}: EditorLayoutProps) {
  return (
    <div className="editor-layout">
      <div className="editor-toolbar">{toolbar}</div>
      <div className="editor-panes">
        <section className="editor-pane editor-pane--source">{editor}</section>
        <section className="editor-pane editor-pane--preview">
          {preview}
        </section>
      </div>
      {sidebar}
    </div>
  );
}
