console.log("YouTube Playlist Buttons: content script loaded");

// YouTube command execution for playlist operations
function executeYouTubeCommand(action) {
  const getAddVideoParams = (videoId) => ({
    clickTrackingParams: "",
    commandMetadata: { webCommandMetadata: { sendPost: true, apiUrl: "/youtubei/v1/browse/edit_playlist" } },
    playlistEditEndpoint: { playlistId: "WL", actions: [{ addedVideoId: videoId, action: "ACTION_ADD_VIDEO" }] }
  });
  
  const getRemoveVideoParams = (videoId) => ({
    clickTrackingParams: "",
    commandMetadata: { webCommandMetadata: { sendPost: true, apiUrl: "/youtubei/v1/browse/edit_playlist" } },
    playlistEditEndpoint: { playlistId: "WL", actions: [{ action: "ACTION_REMOVE_VIDEO_BY_VIDEO_ID", removedVideoId: videoId }] }
  });

  const sendActionToNativeYouTubeHandler = (getParams) => {
    const location = new URL(window.location.href);
    const appElement = document.querySelector("ytd-app");
    let videoId = location.searchParams.get("v");

    if (location.pathname.startsWith("/shorts/")) {
      videoId = location.pathname.split("/")[2];
    }

    if (!videoId || !appElement) {
      return;
    }
  
    const event = new window.CustomEvent('yt-action', {
      detail: {
        actionName: 'yt-service-request',
        returnValue: [],
        args: [{ data: {} }, getParams(videoId)],
        optionalAction: false,
      }
    });
  
    appElement.dispatchEvent(event);
  };

  try {
    if (action === "add-to-watch-later") {
      sendActionToNativeYouTubeHandler(getAddVideoParams);
    }
    if (action === "remove-from-watch-later") {
      sendActionToNativeYouTubeHandler(getRemoveVideoParams);
    }
  } catch (error) {
    console.warn("Error while sending message to native YouTube handler", error);
  }
}

// Listen for custom events from player buttons
window.addEventListener('youtube-plus-watch-later', (event) => {
  console.log('[YouTube Playlist Buttons] Received watch later event:', event.detail);
  executeYouTubeCommand(event.detail.action);
});

// Listen for other playlist-related events if needed
window.addEventListener('youtube-plus-playlist-action', (event) => {
  console.log('[YouTube Playlist Buttons] Received playlist action event:', event.detail);
  executeYouTubeCommand(event.detail.action);
});

// Clicks `menuButton`, then waits for a visible popup menu item whose text contains `label` and clicks it.
// Polls because the popup renders late (notably for unavailable/private videos), and only
// looks at visible menu items so a stale, hidden popup isn't matched.
function clickMenuOption(menuButton, label) {
  if (!menuButton) return Promise.resolve(false);
  menuButton.click();

  return new Promise(resolve => {
  const startedAt = Date.now();
  const tryClick = () => {
    const option = Array.from(document.querySelectorAll(
      'ytd-popup-container ytd-menu-service-item-renderer, ytd-popup-container ytd-menu-navigation-item-renderer'
    )).find(el => el.offsetParent !== null &&
      el.textContent.replace(/\s+/g, ' ').trim().toLowerCase().includes(label));
    if (option) {
      (option.querySelector('tp-yt-paper-item') || option).click();
      resolve(true);
      return;
    }
    if (Date.now() - startedAt < 2000) {
      setTimeout(tryClick, 50);
    } else {
      // Give up quietly and close the menu rather than leaving it open.
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      resolve(false);
    }
  };
  setTimeout(tryClick, 50);
  });
}

function visibleButton(buttons) {
  return Array.from(buttons).find(btn => btn.offsetParent !== null);
}

// Opens a playlist item's 3-dot menu and clicks the matching option.
function clickPlaylistMenuOption(item, label) {
  // YouTube keeps a hidden legacy yt-icon-button next to the real yt-button-shape, so pick the visible one.
  return clickMenuOption(visibleButton(item.querySelectorAll('#menu button')), label);
}

// Watch later clean-up, driven by YouTube's "unavailable videos" alert:
// 1. pick "Show unavailable videos" from the playlist menu (they're hidden by default),
// 2. remove each "[Deleted video]" / "[Private video]" item via its own 3-dot menu,
// 3. pick "Hide unavailable videos" again if the alert is still showing.
const UNAVAILABLE_TITLE = /^\[(deleted|private|unavailable)[^\]]*\]$/i;
let cleanupRunning = false;
let hideUnavailableAttemptedFor = null;

function isWatchLaterPage() {
  return location.pathname === '/playlist' && new URLSearchParams(location.search).get('list') === 'WL';
}

function findUnavailableItem() {
  return Array.from(document.querySelectorAll('ytd-browse ytd-playlist-video-renderer'))
    .find(item => !item.dataset.toolkitRemoveTried &&
      UNAVAILABLE_TITLE.test(item.querySelector('#video-title')?.textContent.trim() || ''));
}

function findUnavailableAlert() {
  return Array.from(document.querySelectorAll('ytd-browse ytd-alert-with-button-renderer'))
    .find(el => el.offsetParent !== null &&
      /unavailable video/i.test(el.querySelector('#text')?.textContent || ''));
}

// The playlist header's menu, not one of the per-video menus.
function findPlaylistHeaderMenuButton() {
  return visibleButton(
    Array.from(document.querySelectorAll('ytd-browse button[aria-label="More actions"], ytd-browse button[aria-label="Action menu"]'))
      .filter(btn => !btn.closest('ytd-playlist-video-renderer'))
  );
}

// YouTube hides unavailable videos by default, so they must be shown before they can be removed.
let showUnavailableAttemptedFor = null;
function clickShowUnavailableVideos() {
  if (showUnavailableAttemptedFor === location.href || !findUnavailableAlert()) return Promise.resolve(false);
  const headerMenuButton = findPlaylistHeaderMenuButton();
  if (!headerMenuButton) return Promise.resolve(false);
  showUnavailableAttemptedFor = location.href;
  return clickMenuOption(headerMenuButton, 'show unavailable videos');
}

function clickHideUnavailableVideos() {
  if (hideUnavailableAttemptedFor === location.href || !findUnavailableAlert()) return Promise.resolve(false);
  const headerMenuButton = findPlaylistHeaderMenuButton();
  if (!headerMenuButton) return Promise.resolve(false);
  hideUnavailableAttemptedFor = location.href;
  return clickMenuOption(headerMenuButton, 'hide unavailable videos');
}

async function cleanUpWatchLater() {
  // Only act while YouTube's "unavailable videos" banner is on the page; never open menus otherwise.
  if (cleanupRunning || !isWatchLaterPage() || !findUnavailableAlert()) return;
  cleanupRunning = true;
  try {
    if (!findUnavailableItem() && await clickShowUnavailableVideos()) {
      // The list re-renders with the unavailable items; the observer will call us again.
      return;
    }

    let item;
    while (isWatchLaterPage() && (item = findUnavailableItem())) {
      item.dataset.toolkitRemoveTried = 'true';
      await clickPlaylistMenuOption(item, 'remove from watch later');
      // Let YouTube process the removal and close the popup before opening the next menu.
      await new Promise(r => setTimeout(r, 600));
    }
    if (isWatchLaterPage()) await clickHideUnavailableVideos();
  } finally {
    cleanupRunning = false;
  }
}

// X Icons functionality (runs on all pages)
function addXIcons() {
  const items = document.querySelectorAll('ytd-playlist-video-renderer');
  items.forEach(item => {
    if (item.querySelector('.ytp-x-icon')) return;

    const menu = item.querySelector('#menu');
    if (!menu) return;

    const xIcon = document.createElement('span');
    xIcon.className = 'ytp-x-icon';
    xIcon.innerHTML = '&#10005;';
    xIcon.title = 'Remove';
    xIcon.style.cursor = 'pointer';
    xIcon.onclick = (e) => {
      e.stopPropagation();
      const isWatchLater = new URLSearchParams(window.location.search).get('list') === 'WL';
      const label = isWatchLater ? 'remove from watch later' : 'remove from';
      clickPlaylistMenuOption(item, label);
    };

    const saveIcon = document.createElement('span');
    saveIcon.className = 'ytp-save-icon';
    saveIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" focusable="false" aria-hidden="true" style="pointer-events: none; display: inherit; width: 100%; height: 100%;"><path fill="currentColor" d="M18 4v15.06l-5.42-3.87-.58-.42-.58.42L6 19.06V4h12m1-1H5v18l7-5 7 5V3z"></path></svg>`;
    saveIcon.title = 'Save to playlist';
    saveIcon.style.cursor = 'pointer';
    saveIcon.style.marginRight = '8px';
    saveIcon.onclick = (e) => {
      e.stopPropagation();
      clickPlaylistMenuOption(item, 'save to playlist');
    };

    menu.parentNode.insertBefore(saveIcon, menu);
    if (saveIcon.nextSibling) {
      menu.parentNode.insertBefore(xIcon, saveIcon.nextSibling);
    } else {
      menu.parentNode.appendChild(xIcon);
    }
  });
}

// Initialize playlist icons functionality
addXIcons();
cleanUpWatchLater();
const xIconsObserver = new MutationObserver(() => {
  addXIcons();
  cleanUpWatchLater();
});
xIconsObserver.observe(document.body, { childList: true, subtree: true });

// CSS styles for playlist icons
const playlistIconsStyle = document.createElement('style');
playlistIconsStyle.textContent = `
  .ytp-x-icon {
    font-size: 20px;
    color: #888;
    margin-left: 12px;
    margin-right: 12px;
    vertical-align: middle;
    transition: color 0.2s;
  }
  .ytp-x-icon:hover {
    color: #f00;
  }
  .ytp-save-icon {
    font-size: 20px;
    color: #888;
    margin-right: 20px;
    vertical-align: middle;
    transition: color 0.2s;
  }
  .ytp-save-icon:hover {
    color: #f00;
  }
`;
document.head.appendChild(playlistIconsStyle);

console.log('[YouTube Plus] Playlist icons module loaded');
