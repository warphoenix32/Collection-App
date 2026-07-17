(() => {
  const DCE = globalThis.DCE;
  DCE.hosts = DCE.hosts || {};
  DCE.hosts.browserExtension = Object.freeze({
    id: "browser-extension",
    context: () => ({ url: location.href, hostname: location.hostname, pathname: location.pathname, document }),
    storage: {
      get: key => chrome.storage.local.get(key),
      set: values => chrome.storage.local.set(values),
      remove: key => chrome.storage.local.remove(key)
    },
    now: () => new Date()
  });
})();
