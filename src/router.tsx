import { createBrowserRouter, Navigate } from 'react-router-dom';

import { DocumentListPage } from './pages/DocumentListPage';
import { EditorRoute } from './pages/EditorRoute';
import { ViewPage } from './pages/ViewPage';

const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/';

export const router = createBrowserRouter(
  [
    { path: '/', element: <DocumentListPage /> },
    { path: '/view/:id', element: <ViewPage /> },
    { path: '/edit/:id', element: <EditorRoute /> },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  { basename: basename === '/' ? undefined : basename }
);
