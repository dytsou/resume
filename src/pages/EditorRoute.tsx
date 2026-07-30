import { useParams } from 'react-router-dom';

import { EditorPage } from './EditorPage';

export function EditorRoute() {
  const { id } = useParams<{ id: string }>();
  return <EditorPage key={id} />;
}
