import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/language';
import { stex } from '@codemirror/legacy-modes/mode/stex';

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function LatexEditor({ value, onChange }: LatexEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="100%"
      extensions={[StreamLanguage.define(stex)]}
      onChange={onChange}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
      }}
      className="latex-editor"
    />
  );
}
