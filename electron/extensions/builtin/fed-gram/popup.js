const input = document.querySelector('#url');
const status = document.querySelector('#status');
function isInstagramPost(value) { try { const url = new URL(value); return /(^|\.)instagram\.com$/.test(url.hostname) && /^\/(p|reel|tv)\//.test(url.pathname); } catch { return false; } }
document.querySelector('#useCurrent').addEventListener('click', () => chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => { input.value = tab?.url || ''; }));
document.querySelector('#prepare').addEventListener('click', async () => {
  const value = input.value.trim();
  if (!isInstagramPost(value)) { status.textContent = 'Enter a public Instagram post, reel, or TV URL.'; return; }
  await chrome.storage.local.set({lastPublicPost: value});
  await navigator.clipboard?.writeText(value).catch(() => {});
  status.textContent = 'Public post URL saved and copied.';
});
