import { useState } from 'react';
import { convertToDirectDownloadLink, downloadFile } from '../utils/googleDriveUtils';

interface DownloadFromDriveButtonProps {
  /** Google Drive share link */
  driveLink: string;
  /** Optional filename for the downloaded file */
  filename?: string;
  /** Optional custom button text */
  buttonText?: string;
}

export function DownloadFromDriveButton({
  driveLink,
  filename,
  buttonText = 'Download Resume',
}: DownloadFromDriveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!driveLink) {
      setError('No Google Drive link provided');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const directLink = convertToDirectDownloadLink(driveLink);

      if (!directLink) {
        throw new Error('Invalid Google Drive link format');
      }

      // Trigger download
      downloadFile(directLink, filename);

      // Reset loading state after a short delay
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      setError(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="download-drive-button-container">
      <button
        onClick={handleDownload}
        disabled={isLoading || !driveLink}
        className="download-drive-button"
        aria-label={buttonText}
        title={buttonText}
      >
        {isLoading ? (
          <span className="button-spinner" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </span>
        ) : (
          <span className="button-icon" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </span>
        )}
      </button>
      {error && (
        <div className="download-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}


