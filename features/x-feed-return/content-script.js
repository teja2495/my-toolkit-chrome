(function () {
    if (window.__toolkitFeedReturnLoaded) return;
    window.__toolkitFeedReturnLoaded = true;

    const STORAGE_KEY = 'xFeedReturn.readingPost';
    const TWEET_SELECTOR = 'article[data-testid="tweet"]';
    const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
    let anchor = null;
    let recovery = null;
    let host = null;
    let timer = null;
    let route = location.pathname + location.search;
    let tab = '';
    let ignoreUntil = 0;
    let touching = false;
    let scrollbarDragging = false;
    let savedId = '';
    let pendingReload = null;
    let refreshAnchor = null;

    // sessionStorage is per tab. Keep only a short-lived link, never tweet text.
    try {
        const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation?.type === 'reload' && saved?.route === route &&
            Date.now() - saved.savedAt < 5 * 60 * 1000 && validPost(saved)) {
            pendingReload = saved;
        }
    } catch (_) { /* Storage may be unavailable. Live recovery still works. */ }

    function validPost(post) {
        if (!post || typeof post.url !== 'string' || typeof post.id !== 'string') return false;
        try {
            const url = new URL(post.url);
            return ['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com'].includes(url.hostname) &&
                url.protocol === 'https:' && /^\/[^/]+\/status\/\d+$/.test(url.pathname) &&
                url.pathname.endsWith('/' + post.id);
        } catch (_) { return false; }
    }

    function getPosts() {
        const column = document.querySelector('[data-testid="primaryColumn"]') || document.querySelector('main');
        if (!column) return [];
        return Array.from(column.querySelectorAll(TWEET_SELECTOR)).flatMap((article) => {
            // The timestamp links to the outer post, unlike quoted-post and media links.
            const time = article.querySelector('a[href*="/status/"] time');
            // Promoted posts can omit the timestamp but still expose a post analytics link.
            const link = time?.closest('a') || article.querySelector('a[href*="/status/"][href$="/analytics"]');
            if (!link) return [];
            const url = new URL(link.href, location.origin);
            url.pathname = url.pathname.replace(/\/analytics$/, '');
            const match = url.pathname.match(/^\/[^/]+\/status\/(\d+)$/);
            if (!match) return [];
            return [{ id: match[1], url: url.origin + url.pathname, article, rect: article.getBoundingClientRect() }];
        });
    }

    function readingPost(posts) {
        const visible = posts.filter((post) => post.rect.bottom > 80 && post.rect.top < innerHeight && post.rect.width > 0);
        const line = innerHeight * 0.5;
        return visible
            .sort((a, b) => distance(a.rect) - distance(b.rect))[0] || null;

        function distance(rect) {
            return rect.top <= line && rect.bottom >= line ? 0 : Math.min(Math.abs(rect.top - line), Math.abs(rect.bottom - line));
        }
    }

    function remember(post) {
        anchor = post ? { id: post.id, url: post.url, top: post.rect.top } : null;
        if (!anchor || savedId === anchor.id) return;
        savedId = anchor.id;
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...anchor, route, savedAt: Date.now() }));
        } catch (_) { /* Live recovery does not require storage. */ }
    }

    function dismiss() {
        host?.remove();
        host = null;
        recovery = null;
    }

    function showBanner(post) {
        if (recovery) return; // Preserve the first lost post through repeated refreshes.
        recovery = { ...post };
        host = document.createElement('div');
        host.id = 'toolkit-feed-return';
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                :host { all: initial; position: fixed; bottom: max(28px, env(safe-area-inset-bottom));
                    left: 50%; transform: translateX(-50%); width: max-content; max-width: calc(100vw - 32px);
                    z-index: 2147483646; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color-scheme: light dark; }
                .banner { display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 20px;
                    background: #152330; color: #f7fbff; border: 1px solid #43617a;
                    box-shadow: 0 12px 48px #0005, 0 2px 8px #0003; animation: appear .2s ease-out; }
                button { font: inherit; color: inherit; border: 0; cursor: pointer; }
                .return { display: flex; align-items: center; gap: 12px; padding: 9px 12px;
                    border-radius: 13px; background: transparent; text-align: left; font-size: 14px; font-weight: 600; line-height: 1.4; }
                .return:hover { background: #ffffff12; }
                .icon { color: #83cbff; flex-shrink: 0; }
                .close { border-radius: 50%; background: transparent; font-size: 22px; width: 36px; height: 36px; flex-shrink: 0; }
                .close:hover { background: #ffffff18; }
                button:focus-visible { outline: 2px solid #83cbff; outline-offset: 2px; }
                @keyframes appear { from { opacity: 0; translate: 0 8px; } to { opacity: 1; translate: 0 0; } }
                @media (max-width: 600px) { :host { bottom: max(76px, env(safe-area-inset-bottom)); } }
                @media (prefers-reduced-motion: reduce) { .banner { animation: none; } }
            </style>
            <div class="banner" role="status" aria-live="polite">
                <button class="return" type="button">
                    <svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5 3 11l6 6M3 11h11a6 6 0 0 1 6 6v2"/></svg>
                    <span>Go back to the post you previously looked at</span>
                </button>
                <button class="close" type="button" aria-label="Dismiss return to post banner">×</button>
            </div>`;
        shadow.querySelector('.close').addEventListener('click', dismiss);
        shadow.querySelector('.return').addEventListener('click', () => {
            const target = recovery;
            if (!target) return;
            const loaded = getPosts().find((post) => post.id === target.id);
            dismiss();
            refreshAnchor = null;
            ignoreUntil = performance.now() + 1200;
            if (loaded) {
                window.scrollBy({ top: loaded.rect.top - Math.max(90, target.top || 90), behavior: 'instant' });
                anchor = null;
                schedule();
            } else if (validPost(target)) {
                location.assign(target.url);
            }
        });
        (document.body || document.documentElement).appendChild(host);
    }

    function check() {
        timer = null;
        const nextRoute = location.pathname + location.search;
        // A refresh can briefly remove the tab bar; that is not a tab switch.
        const nextTab = document.querySelector('[data-testid="primaryColumn"] [role="tab"][aria-selected="true"]')?.textContent.trim() || (nextRoute === route ? tab : '');
        if (nextRoute !== route || nextTab !== tab) {
            // Switching timeline tabs is intentional, not a lost reading position.
            if (nextRoute !== route || tab) {
                dismiss();
                pendingReload = null;
                refreshAnchor = null;
            }
            anchor = null;
            savedId = '';
            route = nextRoute;
            tab = nextTab;
        }
        if (document.hidden || /\/status\/\d+|^\/(?:compose|messages|settings|notifications)(?:\/|$)/.test(location.pathname)) {
            anchor = null;
            refreshAnchor = null;
            dismiss();
            return;
        }
        const posts = getPosts();
        const current = readingPost(posts);
        // Wait through empty intermediate renders rather than forgetting the old post.
        if (!current) return;
        if (pendingReload) {
            if (current.id !== pendingReload.id) showBanner(pendingReload);
            pendingReload = null;
        }
        if (refreshAnchor && performance.now() > refreshAnchor.expires) refreshAnchor = null;
        const tracked = refreshAnchor || anchor;
        const scrolling = touching || scrollbarDragging || performance.now() <= ignoreUntil;
        let lost = false;
        if (tracked && (!scrolling || refreshAnchor)) {
            const previous = posts.find((post) => post.id === tracked.id);
            const displaced = previous && current.id !== tracked.id &&
                (previous.rect.bottom <= 80 || previous.rect.top >= innerHeight ||
                    Math.abs(previous.rect.top - tracked.top) > Math.max(120, innerHeight * 0.2));
            lost = !previous || displaced;
            if (lost) {
                showBanner(tracked);
                refreshAnchor = null;
            }
        }
        // DOM updates must not overwrite the pre-refresh position in small steps.
        if (!anchor || scrolling || lost) remember(current);
    }

    function schedule() {
        // One scan per burst, even when the feed continuously mutates.
        if (timer === null) timer = setTimeout(check, 100);
    }

    function onScrollIntent() {
        refreshAnchor = null;
        ignoreUntil = performance.now() + 1000;
        schedule();
    }

    window.addEventListener('wheel', onScrollIntent, { passive: true });
    window.addEventListener('touchstart', () => { touching = true; onScrollIntent(); }, { passive: true });
    window.addEventListener('touchend', () => { touching = false; onScrollIntent(); }, { passive: true });
    window.addEventListener('touchcancel', () => { touching = false; onScrollIntent(); }, { passive: true });
    window.addEventListener('pointerdown', (event) => {
        scrollbarDragging = event.clientX >= document.documentElement.clientWidth;
        // Ordinary clicks (including Home's feed refresh) do not indicate scrolling.
        if (scrollbarDragging || event.button === 1) onScrollIntent();
    }, { passive: true });
    window.addEventListener('pointerup', () => { scrollbarDragging = false; }, { passive: true });
    document.addEventListener('click', (event) => {
        const control = event.target instanceof Element ? event.target.closest('a[href="/home"], [role="tab"][aria-selected="true"]') : null;
        if (!control || location.pathname !== '/home' ||
            (control.matches('[role="tab"]') && !control.closest('[data-testid="primaryColumn"]'))) return;
        // Capture before X's click handler scrolls or replaces the timeline.
        const post = anchor || readingPost(getPosts());
        if (!post) return;
        refreshAnchor = { id: post.id, url: post.url, top: post.top ?? post.rect.top, expires: performance.now() + 15000 };
        ignoreUntil = 0;
        schedule();
    }, true);
    window.addEventListener('keydown', (event) => {
        if (SCROLL_KEYS.has(event.key)) onScrollIntent();
        if (event.key === 'Escape') dismiss();
    });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', () => { anchor = null; schedule(); }, { passive: true });
    document.addEventListener('visibilitychange', () => { anchor = null; schedule(); });
    new MutationObserver((mutations) => {
        // X repositions virtualized posts via inline transforms without adding nodes.
        if (mutations.some((mutation) => mutation.type !== 'attributes' || mutation.attributeName === 'aria-selected' ||
            mutation.target.matches('[data-testid="cellInnerDiv"]'))) schedule();
    }).observe(document.documentElement, {
        childList: true, subtree: true, attributes: true, attributeFilter: ['aria-selected', 'style'],
    });
    // Also catches History API navigation without patching X's page scripts.
    setInterval(() => {
        if (location.pathname + location.search !== route) schedule();
    }, 1000);
    window.addEventListener('pagehide', () => {
        if (!anchor) return;
        savedId = '';
        remember({ ...anchor, rect: { top: anchor.top } });
    });
    schedule();
})();
