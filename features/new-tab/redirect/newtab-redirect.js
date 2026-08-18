const CUSTOM_NEW_TAB_URL_STORAGE_KEY = 'customNewTabUrl';
const FALLBACK_NEW_TAB_URL = 'https://www.google.com/';

function normalizeCustomNewTabUrl(rawUrl) {
    if (typeof rawUrl !== 'string') {
        return null;
    }

    const trimmedUrl = rawUrl.trim();
    if (!trimmedUrl) {
        return null;
    }

    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmedUrl);
    const candidateUrl = hasScheme ? trimmedUrl : `https://${trimmedUrl}`;

    let parsedUrl;
    try {
        parsedUrl = new URL(candidateUrl);
    } catch (error) {
        return null;
    }

    // Prevent redirect loops when new tab is overridden by this extension.
    if (parsedUrl.protocol === 'chrome:' && parsedUrl.hostname === 'newtab') {
        return null;
    }

    return parsedUrl.toString();
}

async function resolveTargetNewTabUrl() {
    const result = await chrome.storage.sync.get([CUSTOM_NEW_TAB_URL_STORAGE_KEY]);
    const customUrl = normalizeCustomNewTabUrl(result[CUSTOM_NEW_TAB_URL_STORAGE_KEY]);

    return customUrl || FALLBACK_NEW_TAB_URL;
}

(async function redirectNewTab() {
    const targetUrl = await resolveTargetNewTabUrl();
    window.location.replace(targetUrl);
}());
