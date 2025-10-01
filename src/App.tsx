import { useEffect } from 'react';

function App() {
  useEffect(() => {
    document.title = 'Resume';
  }, []);

  // Try different approaches to load the resume
  const getResumeUrl = () => {
    const baseUrl = import.meta.env.BASE_URL;

    // For GitHub Pages, use absolute path
    if (baseUrl === '/resume/') {
      return '/resume/converted-docs/resume.html';
    }
    // For local development
    return `${baseUrl}converted-docs/resume.html`;
  };

  return (
    <iframe
      src={getResumeUrl()}
      title="Resume"
      style={{ border: 'none', width: '100vw', height: '100vh' }}
      onLoad={() => console.log('Iframe loaded successfully')}
      onError={(e) => console.error('Iframe error:', e)}
    />
  );
}

export default App;
