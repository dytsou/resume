import { useEffect } from 'react';
import { DownloadFromDriveButton } from './components/DownloadFromDriveButton';
import { getResumeUrl, getGoogleDriveResumeLink } from './utils/resumeUtils';

/**
 * Main application component
 * Displays the resume in an iframe and optionally provides a download button
 */
function App() {
  useEffect(() => {
    document.title = 'Resume';
  }, []);

  const resumeUrl = getResumeUrl();
  const googleDriveLink = getGoogleDriveResumeLink();

  const handleIframeLoad = () => {
    console.log('Iframe loaded successfully');
  };

  const handleIframeError = (e: React.SyntheticEvent<HTMLIFrameElement, Event>) => {
    console.error('Iframe error:', e);
  };

  return (
    <>
      {googleDriveLink && (
        <div className="download-button-wrapper">
          <DownloadFromDriveButton
            driveLink={googleDriveLink}
            filename="resume.pdf"
            buttonText="Download Resume"
          />
        </div>
      )}
      <iframe
        src={resumeUrl}
        title="Resume"
        style={{ border: 'none', width: '100vw', height: '100vh' }}
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </>
  );
}

export default App;
