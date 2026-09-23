(() => {
  window.__surfFedPageInfo = () => ({
    title: document.title,
    url: location.href,
    host: location.host,
    width: document.documentElement?.scrollWidth || 0,
    height: document.documentElement?.scrollHeight || 0,
  });
})();
