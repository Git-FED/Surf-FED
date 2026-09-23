const AUDIO_KEY = 'surf-fed-tauri-audio-v1';

export function readAudioSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(AUDIO_KEY) || '{}');
    return {
      muteByDefault: saved.muteByDefault !== false,
      whitelist: Array.isArray(saved.whitelist) ? saved.whitelist.filter((origin) => typeof origin === 'string') : [],
    };
  } catch {
    return { muteByDefault: true, whitelist: [] };
  }
}

export function writeAudioSettings(settings) {
  localStorage.setItem(AUDIO_KEY, JSON.stringify({
    muteByDefault: Boolean(settings.muteByDefault),
    whitelist: Array.isArray(settings.whitelist) ? settings.whitelist : [],
  }));
}

export function shouldMute(origin) {
  const settings = readAudioSettings();
  return settings.muteByDefault && !settings.whitelist.includes(origin);
}

// WebKit does not expose Chromium's setAudioMuted API. Native Tauri commands
// are the integration point for device audio policy.
