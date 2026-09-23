import { readAudioSettings, writeAudioSettings } from './audio-controller.js';

const STORAGE_KEY = 'surf-fed-tauri-splitview-v1';
const DEFAULT_URL = 'https://example.com';
const state = { layout: 1, focusedPane: 0, nextId: 1, panes: [null, null, null], dividers: [50, 50], tabs: new Map() };
const area = document.querySelector('#paneArea');
const urlBar = document.querySelector('#urlBar');
const muteButton = document.querySelector('#muteBtn');

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    layout: state.layout,
    focusedPane: state.focusedPane,
    panes: state.panes,
    dividers: state.dividers,
    tabs: [...state.tabs.values()].map(({ id, url, title }) => ({ id, url, title })),
    nextId: state.nextId,
  }));
}

function isParked(id) { return Number.isInteger(id) && !state.panes.includes(id); }
function focusedTab() { return state.tabs.get(state.panes[state.focusedPane]) || null; }
function originOf(url) { try { return new URL(url).origin; } catch { return ''; } }

function applyMutePolicy(tab) {
  // WebKit does not expose Chromium's setAudioMuted API. Keep the policy in
  // local storage so native Tauri audio integration can consume the same state.
  tab.muted = readAudioSettings().muteByDefault && !readAudioSettings().whitelist.includes(originOf(tab.url));
}

function createTab(url = DEFAULT_URL, assign = true, saved = {}) {
  const id = Number.isInteger(saved.id) && saved.id > 0 ? saved.id : state.nextId;
  state.nextId = Math.max(state.nextId, id + 1);
  const frame = document.createElement('iframe');
  frame.title = 'Surf FED browser tab';
  frame.src = url;
  frame.dataset.tabId = String(id);
  frame.className = 'live-frame';
  const tab = { id, url, title: saved.title || url, frame, muted: false };
  applyMutePolicy(tab);
  frame.addEventListener('load', () => { render(); saveState(); });
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
  state.layout = Math.max(1, Math.min(3, Number(layout) || 1));
  state.focusedPane = Math.min(state.focusedPane, state.layout - 1);
  refill(); applyLayout(); render(); saveState();
}

function focusPane(index) {
  if (index >= 0 && index < state.layout) {
    state.focusedPane = index;
    applyLayout(); render(); saveState();
  }
}

function applyLayout() {
  const widths = state.layout === 1
    ? ['100%']
    : state.layout === 2
      ? [`${state.dividers[0]}%`, `calc(100% - ${state.dividers[0]}%)`]
      : [`${state.dividers[0]}%`, `calc(${state.dividers[1]}% - ${state.dividers[0]}%)`, `calc(100% - ${state.dividers[1]}%)`];
  area.style.gridTemplateColumns = widths.join(' ');
  document.querySelectorAll('.mobile-pane').forEach((pane, index) => {
    pane.classList.toggle('visible', index < state.layout);
    pane.classList.toggle('focused', index === state.focusedPane);
  });
  document.querySelectorAll('.mobile-divider').forEach((divider, index) => {
    divider.classList.toggle('visible', index < state.layout - 1);
    divider.style.left = `${state.dividers[index]}%`;
  });
  for (const [id, tab] of state.tabs) {
    const pane = state.panes.indexOf(id);
    const visible = pane >= 0 && pane < state.layout;
    tab.frame.classList.toggle('visible', visible);
    tab.frame.classList.toggle('parked', !visible);
    if (visible) tab.frame.style.gridArea = `1 / ${pane + 1}`;
  }
}

function render() {
  document.querySelectorAll('.mobile-pane').forEach((pane, index) => {
    const tab = state.tabs.get(state.panes[index]);
    pane.textContent = tab?.title || 'Empty';
    pane.onclick = () => focusPane(index);
  });
  const tab = focusedTab();
  urlBar.value = tab?.url || '';
  muteButton.textContent = tab?.muted ? '🔇' : '🔊';
  document.querySelectorAll('[data-layout]').forEach((button) => button.classList.toggle('active', Number(button.dataset.layout) === state.layout));
}

function navigate(value) {
  const tab = focusedTab();
  const input = value.trim();
  if (!tab || !input) return;
  tab.url = /^[a-z][a-z\d+.-]*:/.test(input) ? input : `https://www.google.com/search?q=${encodeURIComponent(input)}`;
  tab.frame.src = tab.url;
  applyMutePolicy(tab);
  render(); saveState();
}

function installDivider(divider, index) {
  divider.addEventListener('pointerdown', (event) => {
    if (state.layout < index + 2) return;
    divider.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      const ratio = (moveEvent.clientX / area.getBoundingClientRect().width) * 100;
      const minimum = index === 0 ? 20 : state.dividers[0] + 10;
      const maximum = index === 0 ? state.dividers[1] - 10 : 95;
      state.dividers[index] = Math.max(minimum, Math.min(maximum, ratio));
      applyLayout();
    };
    const up = () => { divider.removeEventListener('pointermove', move); divider.removeEventListener('pointerup', up); saveState(); };
    divider.addEventListener('pointermove', move);
    divider.addEventListener('pointerup', up);
  });
}

for (let i = 0; i < 3; i += 1) {
  const pane = document.createElement('button');
  pane.className = 'mobile-pane';
  pane.dataset.pane = String(i);
  area.appendChild(pane);
}
for (let i = 0; i < 2; i += 1) {
  const divider = document.createElement('div');
  divider.className = 'mobile-divider';
  divider.dataset.divider = String(i);
  area.appendChild(divider);
  installDivider(divider, i);
}
document.querySelectorAll('[data-layout]').forEach((button) => button.addEventListener('click', () => setLayout(button.dataset.layout)));
document.querySelector('#goBtn').addEventListener('click', () => navigate(urlBar.value));
urlBar.addEventListener('keydown', (event) => { if (event.key === 'Enter') navigate(urlBar.value); });
muteButton.addEventListener('click', () => {
  const settings = readAudioSettings();
  settings.muteByDefault = !settings.muteByDefault;
  writeAudioSettings(settings);
  for (const tab of state.tabs.values()) applyMutePolicy(tab);
  render();
});

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved) {
    state.layout = Math.max(1, Math.min(3, Number(saved.layout) || 1));
    state.focusedPane = Math.max(0, Math.min(state.layout - 1, Number(saved.focusedPane) || 0));
    state.panes = Array.isArray(saved.panes) && saved.panes.length === 3 ? saved.panes.map((id) => Number.isInteger(id) && id > 0 ? id : null) : [null, null, null];
    state.dividers = Array.isArray(saved.dividers) ? saved.dividers : [50, 50];
    state.nextId = Math.max(1, Number(saved.nextId) || 1);
    for (const tab of Array.isArray(saved.tabs) ? saved.tabs : []) createTab(tab.url || DEFAULT_URL, false, tab);
    state.panes = state.panes.map((id) => state.tabs.has(id) ? id : null);
    refill();
  } else createTab();
} catch {
  localStorage.removeItem(STORAGE_KEY);
  createTab();
}
applyLayout();
render();

export { state, createTab, assignTab, setLayout, focusPane, isParked, saveState };
