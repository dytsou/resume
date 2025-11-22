/**
 * Utility functions for working with Google Drive links
 */

/**
 * Extracts the file ID from various Google Drive link formats
 * Supports:
 * - https://drive.google.com/file/d/{FILE_ID}/view?usp=sharing
 * - https://drive.google.com/file/d/{FILE_ID}/view
 * - https://drive.google.com/open?id={FILE_ID}
 * - https://drive.google.com/uc?id={FILE_ID}
 * - Direct file ID
 */
export function extractGoogleDriveFileId(link: string): string | null {
  if (!link) return null;

  // Try to extract from /file/d/{FILE_ID}/ format
  const fileIdMatch = link.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch) {
    return fileIdMatch[1];
  }

  // Try to extract from ?id={FILE_ID} format
  const idParamMatch = link.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch) {
    return idParamMatch[1];
  }

  // If it's already just a file ID (no URL structure)
  if (/^[a-zA-Z0-9_-]+$/.test(link.trim())) {
    return link.trim();
  }

  return null;
}

/**
 * Converts a Google Drive share link to a direct download link
 * @param shareLink - The Google Drive share link
 * @returns Direct download link or null if conversion fails
 */
export function convertToDirectDownloadLink(shareLink: string): string | null {
  const fileId = extractGoogleDriveFileId(shareLink);
  if (!fileId) {
    return null;
  }

  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Triggers a download of a file from a URL
 * @param url - The URL to download from
 * @param filename - Optional filename for the downloaded file
 */
export function downloadFile(url: string, filename?: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || '';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}


