const settings = audioController.settings();
console.assert(settings.muteByDefault === true, 'default mute should be enabled');
console.assert(audioController.shouldMute('https://example.com/path') === true, 'unknown origin should be muted');
console.assert(audioController.shouldMute('https://example.com/another-page') === true, 'navigated unknown origin should remain muted');
audioController.addOrigin('https://example.com/path');
console.assert(audioController.shouldMute('https://example.com/other') === false, 'whitelisted origin should be audible');
console.assert(audioController.shouldMute('https://example.com/another-page') === false, 'all pages on a whitelisted origin should be audible');
audioController.removeOrigin('https://example.com');
