const AUDIO_STORAGE_KEY = 'surf-fed-audio-settings-v1';

function defaultSettings() {
  return { muteByDefault: true, whitelist: [] };
}

function readSettings() {
  try {
    return { ...defaultSettings(), ...JSON.parse(localStorage.getItem(AUDIO_STORAGE_KEY)) };
  } catch {
    return defaultSettings();
  }
}

function writeSettings(settings) {
  localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
}

function originOf(url) {
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

window.audioController = {
  settings: readSettings,
  save: writeSettings,
  originOf,
  shouldMute(url) {
    const settings = readSettings();
    return settings.muteByDefault && !settings.whitelist.includes(originOf(url));
  },
  applyTo(webview, url) {
    if (!webview || typeof webview.setAudioMuted !== 'function') return;
    webview.setAudioMuted(this.shouldMute(url));
  },
  setDefaultMuted(muteByDefault) {
    const settings = readSettings();
    settings.muteByDefault = Boolean(muteByDefault);
    writeSettings(settings);
    return settings;
  },
  addOrigin(url) {
    const settings = readSettings();
    const origin = originOf(url);
    if (origin && !settings.whitelist.includes(origin)) settings.whitelist.push(origin);
    writeSettings(settings);
    return settings;
  },
  removeOrigin(origin) {
    const settings = readSettings();
    settings.whitelist = settings.whitelist.filter((item) => item !== origin);
    writeSettings(settings);
    return settings;
  },
};
