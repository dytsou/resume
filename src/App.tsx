import { useEffect } from 'react';

function App() {
  useEffect(() => {
    document.title = 'Resume';
  }, []);
  return (
    <iframe
      src={`${import.meta.env.BASE_URL}converted-docs/resume.html`}
      title="Resume"
      style={{ border: 'none', width: '100vw', height: '100vh' }}
    />
  );
}

export default App;
