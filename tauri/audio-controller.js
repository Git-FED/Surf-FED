const AUDIO_KEY = 'surf-fed-tauri-audio-v1';
export function readAudioSettings() { return { muteByDefault: true, whitelist: [], ...JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}') }; }
export function writeAudioSettings(settings) { localStorage.setItem(AUDIO_KEY, JSON.stringify(settings)); }
export function shouldMute(origin) { const settings = readAudioSettings(); return settings.muteByDefault && !settings.whitelist.includes(origin); }
// WebKit does not expose Chromium's setAudioMuted API. Native Tauri commands are the integration point for device audio policy.
