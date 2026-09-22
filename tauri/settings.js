import { readAudioSettings, writeAudioSettings } from './audio-controller.js';
const checkbox = document.querySelector('#muteByDefault');
checkbox.checked = readAudioSettings().muteByDefault;
checkbox.addEventListener('change', () => writeAudioSettings({ ...readAudioSettings(), muteByDefault: checkbox.checked }));
