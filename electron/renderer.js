const STORAGE_KEY = 'surf-fed-splitview-v2';
const DEFAULT_URL = 'https://example.com';

const state = {
  layout: 1,
  focusedPane: 0,
  nextTabId: 1,
  panes: [null, null, null],
  tabs: new Map(),
  dividers: [50, 50],
};

const $ = (id) => document.getElementById(id);
const paneElements = [0, 1, 2].map((index) => $(`pane-${index}`));

function isParked(tabId) {
  return Boolean(tabId) && !state.panes.includes(tabId);
}

function visiblePaneCount() {
  return state.layout;
}

function visibleTabIds() {
  return state.panes.slice(0, state.layout).filter(Boolean);
}

function focusedTab() {
  return state.tabs.get(state.panes[state.focusedPane]) || null;
}

function saveState() {
  const snapshot = {
    layout: state.layout,
    focusedPane: state.focusedPane,
    panes: state.panes,
    dividers: state.dividers,
    tabs: [...state.tabs.values()].map(({ id, url, title }) => ({ id, url, title })),
    nextTabId: state.nextTabId,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

function readSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return null;
    return saved;
  } catch (error) {
    console.warn('Ignoring invalid saved Surf FED state', error);
    return null;
  }
}

function normalizeSavedState(saved) {
  if (!saved) return;
  state.layout = Math.max(1, Math.min(3, Number(saved.layout) || 1));
  state.focusedPane = Math.max(0, Math.min(state.layout - 1, Number(saved.focusedPane) || 0));
  state.panes = Array.isArray(saved.panes) && saved.panes.length === 3
    ? saved.panes
    : [null, null, null];
  state.dividers = Array.isArray(saved.dividers) ? saved.dividers : [50, 50];
  state.nextTabId = Number(saved.nextTabId) || 1;
}

function createWebview(tabId, url) {
  const webview = document.createElement('webview');
  webview.className = 'live-webview';
  webview.dataset.tabId = String(tabId);
  webview.setAttribute('partition', 'persist:surf-fed');
  webview.src = url;

  webview.addEventListener('focus', () => {
    const paneIndex = state.panes.indexOf(tabId);
    if (paneIndex >= 0) focusPane(paneIndex);
  });
  webview.addEventListener('did-navigate', () => {
    const tab = state.tabs.get(tabId);
    if (!tab) return;
    tab.url = webview.getURL() || tab.url;
    audioController.applyTo(webview, tab.url);
    render();
    saveState();
  });
  webview.addEventListener('page-title-updated', (event) => {
    const tab = state.tabs.get(tabId);
    if (!tab) return;
    tab.title = event.title || tab.url;
    render();
    saveState();
  });
  webview.addEventListener('did-fail-load', (event) => {
    if (event.isMainFrame) {
      const tab = state.tabs.get(tabId);
      if (tab) tab.error = `${event.errorDescription} (${event.errorCode})`;
      render();
    }
  });
  return webview;
}

function createTab(url = DEFAULT_URL, { assign = true, id = null, title = null } = {}) {
  const tabId = id || state.nextTabId++;
  const tab = { id: tabId, url, title: title || url, error: null, muted: audioController.shouldMute(url), webview: null };
  tab.webview = createWebview(tabId, url);
  state.tabs.set(tabId, tab);
  $('webviewParking').appendChild(tab.webview);

  if (assign) {
    assignTabToPane(tabId, state.focusedPane);
  }
  audioController.applyTo(tab.webview, url);
  render();
  saveState();
  return tab;
}

function assignTabToPane(tabId, paneIndex) {
  if (!state.tabs.has(tabId)) return false;
  if (paneIndex < 0 || paneIndex > 2) return false;

  const previousPane = state.panes.indexOf(tabId);
  if (previousPane >= 0) state.panes[previousPane] = null;

  const displacedTabId = state.panes[paneIndex];
  if (displacedTabId && displacedTabId !== tabId) {
    // The displaced tab remains in state.tabs and its webview remains in the parking layer.
    state.panes[paneIndex] = null;
  }

  state.panes[paneIndex] = tabId;
  applyLayout();
  render();
  saveState();
  return true;
}

function closeTab(tabId) {
  const tab = state.tabs.get(tabId);
  if (!tab) return false;
  const paneIndex = state.panes.indexOf(tabId);
  if (paneIndex >= 0) state.panes[paneIndex] = null;
  tab.webview.remove();
  state.tabs.delete(tabId);
  refillEmptyPanes();
  if (state.tabs.size === 0) createTab(DEFAULT_URL);
  applyLayout();
  render();
  saveState();
  return true;
}

function refillEmptyPanes() {
  for (let paneIndex = 0; paneIndex < state.layout; paneIndex += 1) {
    if (state.panes[paneIndex]) continue;
    const parked = [...state.tabs.keys()].find(isParked);
    if (parked) state.panes[paneIndex] = parked;
  }
}

function setLayout(layout) {
  const nextLayout = Math.max(1, Math.min(3, Number(layout)));
  state.layout = nextLayout;
  state.focusedPane = Math.min(state.focusedPane, nextLayout - 1);
  // Hidden pane slots intentionally retain their assignments for an exact 3→1→3 round trip.
  refillEmptyPanes();
  applyLayout();
  render();
  saveState();
}

function focusPane(paneIndex) {
  if (paneIndex < 0 || paneIndex >= state.layout) return;
  state.focusedPane = paneIndex;
  applyLayout();
  render();
  saveState();
}

function swapPanes(first, second) {
  if (first < 0 || second < 0 || first > 2 || second > 2) return;
  [state.panes[first], state.panes[second]] = [state.panes[second], state.panes[first]];
  applyLayout();
  render();
  saveState();
}

function applyLayout() {
  $('paneArea').style.setProperty('--first-pane', `${state.dividers[0]}%`);
  $('paneArea').style.setProperty('--second-pane', `${state.dividers[1]}%`);

  paneElements.forEach((pane, paneIndex) => {
    pane.classList.toggle('visible', paneIndex < state.layout);
    pane.classList.toggle('focused', paneIndex === state.focusedPane);
    const tab = state.tabs.get(state.panes[paneIndex]);
    const header = pane.querySelector('.pane-header');
    header.textContent = tab ? tab.title : 'Empty';

    if (!tab) return;
    const areaRect = $('paneArea').getBoundingClientRect();
    const paneRect = pane.getBoundingClientRect();
    const webview = tab.webview;
    webview.style.left = `${paneRect.left - areaRect.left}px`;
    webview.style.top = `${paneRect.top - areaRect.top}px`;
    webview.style.width = `${paneRect.width}px`;
    webview.style.height = `${paneRect.height}px`;
    webview.style.visibility = paneIndex < state.layout ? 'visible' : 'hidden';
    webview.style.pointerEvents = paneIndex < state.layout ? 'auto' : 'none';
  });

  $('divider-0').classList.toggle('visible', state.layout >= 2);
  $('divider-1').classList.toggle('visible', state.layout >= 3);
  document.querySelectorAll('.layout-button').forEach((button) => {
    button.classList.toggle('active', Number(button.dataset.layout) === state.layout);
  });
}

function navigate(url) {
  const tab = focusedTab();
  if (!tab) return;
  const trimmed = url.trim();
  if (!trimmed) return;
  const target = /^[a-z][a-z\d+.-]*:/.test(trimmed)
    ? trimmed
    : `https://www.google.com/search?q=${encodeURIComponent(trimmed)}`;
  tab.url = target;
  tab.error = null;
  tab.webview.loadURL(target);
  audioController.applyTo(tab.webview, target);
  render();
  saveState();
}

function render() {
  const tabStrip = $('tabStrip');
  tabStrip.replaceChildren();
  for (const tab of state.tabs.values()) {
    const chip = document.createElement('button');
    chip.className = 'tab-chip';
    chip.classList.toggle('active', state.panes[state.focusedPane] === tab.id);
    chip.textContent = tab.error ? `⚠ ${tab.title}` : tab.title;
    chip.title = tab.url;
    chip.addEventListener('click', () => {
      const paneIndex = state.panes.indexOf(tab.id);
      if (paneIndex >= 0) focusPane(paneIndex);
      else assignTabToPane(tab.id, state.focusedPane);
    });
    const close = document.createElement('span');
    close.className = 'tab-close';
    close.textContent = '×';
    close.addEventListener('click', (event) => {
      event.stopPropagation();
      closeTab(tab.id);
    });
    chip.appendChild(close);
    tabStrip.appendChild(chip);
  }
  const tab = focusedTab();
  $('urlBar').value = tab ? tab.url : '';
  $('muteBtn').textContent = tab && tab.muted ? '🔇' : '🔊';
}

function restoreTabs() {
  const saved = readSavedState();
  normalizeSavedState(saved);
  if (!saved || !Array.isArray(saved.tabs) || saved.tabs.length === 0) {
    createTab(DEFAULT_URL);
    return;
  }

  const savedTabs = new Map(saved.tabs.map((tab) => [tab.id, tab]));
  for (const tabId of savedTabs.keys()) {
    const tab = savedTabs.get(tabId);
    createTab(tab.url || DEFAULT_URL, { assign: false, id: tab.id, title: tab.title });
  }
  state.panes = state.panes.map((tabId) => (state.tabs.has(tabId) ? tabId : null));
  refillEmptyPanes();
  applyLayout();
  render();
}

async function refreshExtensionPanel() {
  const list = await window.electronAPI.extensions.list();
  const target = $('extensionList');
  target.replaceChildren();
  for (const extension of list) {
    const item = document.createElement('li');
    item.textContent = `${extension.name} · ${extension.version}${extension.builtin ? ' · built-in' : ''}`;
    target.appendChild(item);
  }
  $('extensionStatus').textContent = `${list.length} extension(s) loaded`;
}

function installUiHandlers() {
  $('newTabBtn').addEventListener('click', () => createTab());
  $('goBtn').addEventListener('click', () => navigate($('urlBar').value));
  $('urlBar').addEventListener('keydown', (event) => {
    if (event.key === 'Enter') navigate($('urlBar').value);
  });
  $('backBtn').addEventListener('click', () => focusedTab()?.webview.goBack());
  $('forwardBtn').addEventListener('click', () => focusedTab()?.webview.goForward());
  $('reloadBtn').addEventListener('click', () => focusedTab()?.webview.reload());
  $('muteBtn').addEventListener('click', () => {
    const tab = focusedTab();
    if (tab) {
      tab.muted = !tab.muted;
      tab.webview.setAudioMuted(tab.muted);
      render();
    }
  });
  document.querySelectorAll('.layout-button').forEach((button) => {
    button.addEventListener('click', () => setLayout(button.dataset.layout));
  });
  paneElements.forEach((pane, paneIndex) => {
    pane.querySelector('.pane-header').addEventListener('click', () => focusPane(paneIndex));
  });
  $('extensionsBtn').addEventListener('click', async () => {
    $('extensionsPanel').hidden = !$('extensionsPanel').hidden;
    if (!$('extensionsPanel').hidden) await refreshExtensionPanel();
  });
  $('extensionsCloseBtn').addEventListener('click', () => { $('extensionsPanel').hidden = true; });
  $('extensionReloadBtn').addEventListener('click', async () => {
    const result = await window.electronAPI.extensions.reload();
    $('extensionStatus').textContent = result.ok ? 'Built-ins reloaded.' : result.error;
    if (result.ok) await refreshExtensionPanel();
  });
  $('extensionAddBtn').addEventListener('click', async () => {
    const result = await window.electronAPI.extensions.add();
    $('extensionStatus').textContent = result.error || (result.canceled ? 'Canceled.' : 'Extension loaded.');
    if (!result.error && !result.canceled) await refreshExtensionPanel();
  });
  $('extensionFolderBtn').addEventListener('click', () => window.electronAPI.extensions.openFolder());
  document.querySelectorAll('.divider').forEach((divider) => {
    divider.addEventListener('pointerdown', (event) => {
      if (state.layout < 2) return;
      divider.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        const ratio = (moveEvent.clientX / $('paneArea').getBoundingClientRect().width) * 100;
        if (divider.dataset.divider === '0') state.dividers[0] = Math.max(20, Math.min(80, ratio));
        else state.dividers[1] = Math.max(state.dividers[0] + 10, Math.min(95, ratio));
        applyLayout();
      };
      const up = () => {
        divider.removeEventListener('pointermove', move);
        divider.removeEventListener('pointerup', up);
        saveState();
      };
      divider.addEventListener('pointermove', move);
      divider.addEventListener('pointerup', up);
    });
  });
  window.addEventListener('resize', applyLayout);
}

restoreTabs();
installUiHandlers();
applyLayout();
render();
window.__splitview = {
  state,
  createTab,
  closeTab,
  setLayout,
  focusPane,
  swapPanes,
  assignTabToPane,
  isParked,
  visibleTabIds,
  saveState,
  applyLayout,
};
