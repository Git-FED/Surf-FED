const details = document.querySelector('#details');
function row(label, value) { const dt = document.createElement('dt'); dt.textContent = label; const dd = document.createElement('dd'); dd.textContent = value || 'Unavailable'; details.append(dt, dd); }
chrome.tabs.query({active: true, currentWindow: true}, ([tab]) => {
  details.replaceChildren();
  row('Title', tab?.title);
  row('URL', tab?.url);
  try { row('Host', new URL(tab?.url || '').host); } catch { row('Host', 'Unavailable'); }
});
