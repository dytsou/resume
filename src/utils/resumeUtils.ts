/**
 * Utility functions for resume-related operations
 */

/**
 * Gets the resume HTML file URL based on the current environment
 */
export function getResumeUrl(): string {
  return `${import.meta.env.BASE_URL}converted-docs/resume.html`;
}

/**
 * Gets the Google Drive resume link from environment variables
 */
export function getGoogleDriveResumeLink(): string {
  return import.meta.env.VITE_GOOGLE_DRIVE_RESUME_LINK || '';
}
