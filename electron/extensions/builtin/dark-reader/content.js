(() => {
  if (document.documentElement.dataset.surfFedDarkReader === 'true') return;
  document.documentElement.dataset.surfFedDarkReader = 'true';
  const style = document.createElement('style');
  style.id = 'surf-fed-dark-reader-style';
  style.textContent = `
    html { background: #111 !important; filter: invert(.9) hue-rotate(180deg) !important; }
    img, video, picture, canvas, svg, iframe { filter: invert(1) hue-rotate(180deg) !important; }
  `;
  (document.head || document.documentElement).appendChild(style);
})();
