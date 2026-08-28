import './index.css';

const downloadButton = document.querySelector('.download-drive-button');

if (downloadButton) {
  downloadButton.addEventListener('click', () => {
    downloadButton.setAttribute('aria-busy', 'true');
    window.setTimeout(() => downloadButton.removeAttribute('aria-busy'), 500);
  });
}
