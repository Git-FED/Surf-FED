const checkbox = document.querySelector('#muteByDefault');
const whitelist = document.querySelector('#whitelist');

function render() {
  const settings = audioController.settings();
  checkbox.checked = settings.muteByDefault;
  whitelist.replaceChildren();
  for (const origin of settings.whitelist) {
    const item = document.createElement('li');
    item.textContent = origin;
    const remove = document.createElement('button');
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      audioController.removeOrigin(origin);
      render();
    });
    item.appendChild(remove);
    whitelist.appendChild(item);
  }
}

checkbox.addEventListener('change', () => {
  audioController.setDefaultMuted(checkbox.checked);
  render();
});
render();
