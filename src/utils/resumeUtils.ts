/**
 * Utility functions for resume-related operations
 */

/**
 * Gets the resume HTML file URL based on the current environment
 * Handles both GitHub Pages deployment and local development
 */
export function getResumeUrl(): string {
  const baseUrl = import.meta.env.BASE_URL;

  // For GitHub Pages, use absolute path
  if (baseUrl === '/resume/') {
    return '/resume/converted-docs/resume.html';
  }

  // For local development
  return `${baseUrl}converted-docs/resume.html`;
}

/**
 * Gets the Google Drive resume link from environment variables
 */
export function getGoogleDriveResumeLink(): string {
  return import.meta.env.VITE_GOOGLE_DRIVE_RESUME_LINK || '';
}

