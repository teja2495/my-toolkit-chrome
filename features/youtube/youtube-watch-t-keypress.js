(function() {
  'use strict';

  let lastUrl = location.href;
  let pendingTimeout = null;

  function isWatchUrl(url) {
    try {
      const parsed = new URL(url);
      return parsed.hostname === 'www.youtube.com' && parsed.pathname === '/watch';
    } catch (_) {
      return false;
    }
  }

  function dispatchTKeyPress() {
    const keyEventOptions = {
      key: 't',
      code: 'KeyT',
      keyCode: 84,
      which: 84,
      bubbles: true,
      cancelable: true,
      composed: true
    };

    const target = document.activeElement && document.activeElement !== document.body
      ? document.activeElement
      : document;

    target.dispatchEvent(new KeyboardEvent('keydown', keyEventOptions));
    target.dispatchEvent(new KeyboardEvent('keyup', keyEventOptions));
  }

  function scheduleTKeyPress() {
    if (!isWatchUrl(location.href)) return;

    if (pendingTimeout) {
      clearTimeout(pendingTimeout);
    }

    pendingTimeout = setTimeout(() => {
      dispatchTKeyPress();
      pendingTimeout = null;
    }, 500);
  }

  function observeUrlChanges() {
    const observer = new MutationObserver(() => {
      const currentUrl = location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        scheduleTKeyPress();
      }
    });

    observer.observe(document, { childList: true, subtree: true });
  }

  scheduleTKeyPress();
  observeUrlChanges();
})();
