
let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;

// This partition MUST match WEBVIEW_PARTITION in main.js so that the
// extensions loaded into the session actually run inside these webviews.
const WEBVIEW_PARTITION = 'persist:surf-fed';

const urlBar = document.getElementById('urlBar');
const tabsContainer = document.getElementById('tabsContainer');
const webviewContainer = document.getElementById('webviewContainer');
const newTabBtn = document.getElementById('newTabBtn');
const backBtn = document.getElementById('backBtn');
const forwardBtn = document.getElementById('forwardBtn');
const reloadBtn = document.getElementById('reloadBtn');
const darkModeBtn = document.getElementById('darkModeBtn');
const extensionsBtn = document.getElementById('extensionsBtn');
const extensionsPanel = document.getElementById('extensionsPanel');
const extCloseBtn = document.getElementById('extCloseBtn');
const extAddBtn = document.getElementById('extAddBtn');
const extOpenFolderBtn = document.getElementById('extOpenFolderBtn');
const extReloadBtn = document.getElementById('extReloadBtn');
const extList = document.getElementById('extList');

function createTab(url = 'about:blank', isActive = true) {
  const id = ++tabIdCounter;
  const tab = { id, title: 'New Tab', webview: null };
  tabs.push(tab);

  const webview = document.createElement('webview');
  webview.setAttribute('src', url);
  // Bind this webview to the extension-enabled session partition.
  webview.setAttribute('partition', WEBVIEW_PARTITION);
  // Let extensions that need node-less sandbox still get the standard APIs.
  webview.setAttribute('allowpopups', '');
  webview.style.display = 'none';
  webviewContainer.appendChild(webview);
  tab.webview = webview;

  webview.addEventListener('did-stop-loading', () => {
    try { tab.title = webview.getTitle() || 'New Tab'; } catch (e) { /* ignore */ }
    try { urlBar.value = webview.getURL(); } catch (e) { /* ignore */ }
    updateTabUI();
  });
  webview.addEventListener('page-title-updated', (e) => {
    tab.title = e.title || 'New Tab';
    updateTabUI();
  });

  const tabEl = document.createElement('div');
  tabEl.className = 'tab';
  tabEl.dataset.id = id;
  tabEl.innerHTML = `<span>${tab.title}</span><button class="close-tab">×</button>`;
  tabEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('close-tab')) return;
    activateTab(id);
  });
  tabEl.querySelector('.close-tab').addEventListener('click', (e) => {
    e.stopPropagation();
    closeTab(id);
  });
  tabsContainer.appendChild(tabEl);

  if (isActive) activateTab(id);
  else tab.webview.style.display = 'none';
  updateTabUI();
  return tab;
}

function activateTab(id) {
  activeTabId = id;
  tabs.forEach(t => {
    const isActive = t.id === id;
    t.webview.style.display = isActive ? 'inline-flex' : 'none';
    if (isActive) {
      try { urlBar.value = t.webview.getURL(); } catch (e) { urlBar.value = ''; }
    }
  });
  updateTabUI();
}

function closeTab(id) {
  const idx = tabs.findIndex(t => t.id === id);
  if (idx === -1) return;
  tabs[idx].webview.remove();
  tabs.splice(idx, 1);
  tabsContainer.children[idx]?.remove();
  if (tabs.length === 0) createTab();
  else if (activeTabId === id) activateTab(tabs[Math.min(idx, tabs.length - 1)].id);
  updateTabUI();
}

function updateTabUI() {
  const tabEls = tabsContainer.querySelectorAll('.tab');
  tabEls.forEach((el, i) => {
    const tab = tabs[i];
    if (!tab) return;
    el.classList.toggle('active', tab.id === activeTabId);
    el.querySelector('span').textContent = tab.title;
  });
}

function navigateTo(url) {
  if (!url) return;
  if (!url.includes('.') && !url.startsWith('http')) {
    url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
  } else if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) {
    tab.webview.loadURL(url);
    urlBar.value = url;
  }
}

newTabBtn.addEventListener('click', () => createTab());
backBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) tab.webview.goBack();
});
forwardBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) tab.webview.goForward();
});
reloadBtn.addEventListener('click', () => {
  const tab = tabs.find(t => t.id === activeTabId);
  if (tab) tab.webview.reload();
});
urlBar.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') navigateTo(urlBar.value);
});

// ---------- Dark mode ----------
darkModeBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-mode');
  darkModeBtn.textContent = isDark ? '☀️' : '🌙';
});

// ===========================================================================
// Extensions Manager
// ===========================================================================

function toggleExtensionsPanel() {
  const willOpen = extensionsPanel.classList.contains('hidden');
  extensionsPanel.classList.toggle('hidden');
  if (willOpen) refreshExtensions();
}

extensionsBtn.addEventListener('click', toggleExtensionsPanel);
extCloseBtn.addEventListener('click', () => extensionsPanel.classList.add('hidden'));

async function refreshExtensions() {
  extList.innerHTML = '<p class="ext-loading">Loading extensions…</p>';
  try {
    const list = await window.electronAPI.extensions.list();
    renderExtensionList(list);
  } catch (e) {
    extList.innerHTML = '<p class="ext-error">Could not load extensions: ' + escapeHtml(e.message) + '</p>';
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function renderExtensionList(list) {
  if (!list || !list.length) {
    extList.innerHTML = '<p class="ext-empty">No extensions installed yet. Click “Load unpacked extension…” to add one.</p>';
    return;
  }
  extList.innerHTML = '';
  list.forEach(ext => {
    const row = document.createElement('div');
    row.className = 'ext-row' + (ext.enabled ? ' enabled' : '');

    const info = document.createElement('div');
    info.className = 'ext-info';
    info.innerHTML = `
      <div class="ext-name">
        ${escapeHtml(ext.name)}
        <span class="ext-version">v${escapeHtml(ext.version)}</span>
        ${ext.builtin ? '<span class="ext-badge">built-in</span>' : ''}
      </div>
      <div class="ext-desc">${escapeHtml(ext.description || 'No description')}</div>
      ${ext.loadError ? `<div class="ext-error">⚠ ${escapeHtml(ext.loadError)}</div>` : ''}
    `;

    const controls = document.createElement('div');
    controls.className = 'ext-controls';

    const toggle = document.createElement('label');
    toggle.className = 'ext-switch';
    toggle.title = ext.enabled ? 'Disable' : 'Enable';
    toggle.innerHTML = `<input type="checkbox" ${ext.enabled ? 'checked' : ''}><span class="ext-slider"></span>`;
    const checkbox = toggle.querySelector('input');
    checkbox.addEventListener('change', async () => {
      checkbox.disabled = true;
      if (checkbox.checked) {
        await window.electronAPI.extensions.enable(ext.id);
      } else {
        await window.electronAPI.extensions.disable(ext.id);
      }
      checkbox.disabled = false;
      refreshExtensions();
    });
    controls.appendChild(toggle);

    if (!ext.builtin) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 'ext-remove-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', async () => {
        if (!confirm(`Remove extension "${ext.name}"?`)) return;
        await window.electronAPI.extensions.remove(ext.id);
        refreshExtensions();
      });
      controls.appendChild(removeBtn);
    }

    row.appendChild(info);
    row.appendChild(controls);
    extList.appendChild(row);
  });
}

extAddBtn.addEventListener('click', async () => {
  const res = await window.electronAPI.extensions.add();
  if (res && res.ok) {
    refreshExtensions();
  } else if (res && res.error && res.error !== 'No folder selected') {
    alert('Could not load extension:\n' + res.error);
  }
});

extOpenFolderBtn.addEventListener('click', () => {
  window.electronAPI.extensions.openFolder();
});

extReloadBtn.addEventListener('click', async () => {
  await window.electronAPI.extensions.reload();
  refreshExtensions();
});

createTab('https://www.google.com', true);
