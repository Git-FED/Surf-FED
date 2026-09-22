const STORAGE_KEY = 'surf-fed-tauri-splitview-v1';
const DEFAULT_URL = 'https://example.com';
const state = { layout: 1, focusedPane: 0, nextId: 1, panes: [null, null, null], tabs: new Map() };
const area = document.querySelector('#paneArea');

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ layout: state.layout, focusedPane: state.focusedPane, panes: state.panes, tabs: [...state.tabs.values()].map(({ id, url, title }) => ({ id, url, title })) }));
}
function isParked(id) { return Boolean(id) && !state.panes.includes(id); }
function focusedTab() { return state.tabs.get(state.panes[state.focusedPane]); }
function createTab(url = DEFAULT_URL, assign = true) {
  const id = state.nextId++;
  const frame = document.createElement('iframe');
  frame.title = 'Surf FED browser tab';
  frame.src = url;
  frame.dataset.tabId = String(id);
  frame.className = 'live-frame';
  const tab = { id, url, title: url, frame };
  state.tabs.set(id, tab);
  area.appendChild(frame);
  if (assign) assignTab(id, state.focusedPane);
  render();
  saveState();
  return tab;
}
function assignTab(id, paneIndex) {
  if (!state.tabs.has(id) || paneIndex < 0 || paneIndex > 2) return false;
  const previous = state.panes.indexOf(id);
  if (previous >= 0) state.panes[previous] = null;
  state.panes[paneIndex] = id;
  applyLayout();
  render();
  saveState();
  return true;
}
function refill() {
  for (let i = 0; i < state.layout; i += 1) {
    if (!state.panes[i]) {
      const parked = [...state.tabs.keys()].find(isParked);
      if (parked) state.panes[i] = parked;
    }
  }
}
function setLayout(layout) {
  state.layout = Math.max(1, Math.min(3, Number(layout)));
  state.focusedPane = Math.min(state.focusedPane, state.layout - 1);
  refill(); applyLayout(); render(); saveState();
}
function focusPane(index) {
  if (index >= 0 && index < state.layout) { state.focusedPane = index; applyLayout(); render(); saveState(); }
}
function applyLayout() {
  area.style.gridTemplateColumns = `repeat(${state.layout}, minmax(0, 1fr))`;
  document.querySelectorAll('.mobile-pane').forEach((pane, index) => {
    pane.classList.toggle('visible', index < state.layout);
    pane.classList.toggle('focused', index === state.focusedPane);
  });
  for (const [id, tab] of state.tabs) {
    const pane = state.panes.indexOf(id);
    tab.frame.classList.toggle('visible', pane >= 0 && pane < state.layout);
    tab.frame.classList.toggle('parked', pane < 0 || pane >= state.layout);
    if (pane >= 0 && pane < state.layout) tab.frame.style.gridArea = `1 / ${pane + 1}`;
  }
}
function render() {
  document.querySelectorAll('.mobile-pane').forEach((pane, index) => {
    const tab = state.tabs.get(state.panes[index]);
    pane.textContent = tab?.title || 'Empty';
    pane.onclick = () => focusPane(index);
  });
  const tab = focusedTab();
  document.querySelector('#urlBar').value = tab?.url || '';
  document.querySelectorAll('[data-layout]').forEach((button) => button.classList.toggle('active', Number(button.dataset.layout) === state.layout));
}
function navigate(url) {
  const tab = focusedTab();
  if (!tab) return;
  const value = url.trim();
  const target = /^[a-z][a-z\d+.-]*:/.test(value) ? value : `https://www.google.com/search?q=${encodeURIComponent(value)}`;
  tab.url = target; tab.frame.src = target; render(); saveState();
}
for (let i = 0; i < 3; i += 1) { const pane = document.createElement('button'); pane.className = 'mobile-pane'; pane.dataset.pane = String(i); area.appendChild(pane); }
document.querySelectorAll('[data-layout]').forEach((button) => button.addEventListener('click', () => setLayout(button.dataset.layout)));
document.querySelector('#goBtn').addEventListener('click', () => navigate(document.querySelector('#urlBar').value));
const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
if (saved) { state.layout = saved.layout || 1; state.focusedPane = saved.focusedPane || 0; state.panes = saved.panes || [null, null, null]; for (const tab of saved.tabs || []) createTab(tab.url, false); } else createTab();
refill(); applyLayout(); render();
export { state, createTab, assignTab, setLayout, focusPane, isParked, saveState };
