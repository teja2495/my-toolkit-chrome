(function () {
    if (window.__toolkitFeedReturnLoaded) return;
    window.__toolkitFeedReturnLoaded = true;

    const TWEET_SELECTOR = 'article[data-testid="tweet"]';
    const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
    let anchor = null;
    let recovery = null;
    let host = null;
    let popupHost = null;
    let bannerPostId = null;
    let feedSnapshot = [];
    let timer = null;
    let route = location.pathname + location.search;
    let tab = '';
    let ignoreUntil = 0;
    let touching = false;
    let scrollbarDragging = false;
    let manualRefresh = null;

    // Previews now live only in memory; a page reload starts a fresh feed.
    try {
        sessionStorage.removeItem('xFeedReturn.readingPost');
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
            if (!match || !validPost({ id: match[1], url: url.origin + url.pathname })) return [];
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

    function snapshotPosts(posts) {
        return posts.slice(0, 3).map((post) => ({
            id: post.id,
            url: post.url,
            author: '@' + new URL(post.url).pathname.split('/')[1],
            text: Array.from(post.article.querySelectorAll('[data-testid="tweetText"]'))
                .map((element) => element.innerText || element.textContent || '').join('\n\n').trim().slice(0, 12000),
        }));
    }

    function updateSnapshot(posts, replace = false) {
        const next = snapshotPosts(posts);
        // Keep the original feed's first three posts when X virtualizes them away.
        if (replace || !feedSnapshot.length) feedSnapshot = next;
        else if (feedSnapshot.every((post, index) => post.id === next[index]?.id)) feedSnapshot = next;
    }

    function remember(post) {
        anchor = post ? { id: post.id, url: post.url, top: post.rect.top } : null;
    }

    function dismiss() {
        closePopup();
        host?.remove();
        host = null;
        recovery = null;
        bannerPostId = null;
    }

    function closePopup() {
        if (!popupHost) return;
        popupHost.shadowRoot.querySelector('dialog').close();
        popupHost.remove();
        popupHost = null;
        host?.shadowRoot.querySelector('.open')?.focus({ preventScroll: true });
    }

    function openPopup() {
        if (!recovery?.length || popupHost) return;
        popupHost = document.createElement('div');
        const shadow = popupHost.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                :host { all: initial; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
                dialog { box-sizing: border-box; width: min(580px, calc(100vw - 32px)); max-height: calc(100dvh - 48px);
                    padding: 0; border: 1px solid #384b5b; border-radius: 22px; background: #101923; color: #f1f6fa;
                    box-shadow: 0 24px 100px #0008; overflow-y: auto; font: 14px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
                dialog::backdrop { background: #0009; backdrop-filter: blur(4px); }
                header { position: sticky; top: 0; display: flex; align-items: center; gap: 16px; padding: 20px 24px;
                    background: #101923; border-bottom: 1px solid #2a3947; z-index: 1; }
                header > div { flex: 1; }
                h2 { font-size: 18px; line-height: 1.3; margin: 0; flex: 1; }
                header p { color: #94a8ba; font-size: 12px; margin: 4px 0 0; }
                .close { flex-shrink: 0; width: 36px; height: 36px; border: 0; border-radius: 50%;
                    display: inline-flex; align-items: center; justify-content: center; padding: 0;
                    background: #ffffff0c; color: inherit; cursor: pointer; }
                .close:hover { background: #ffffff1a; }
                .posts { padding: 0 24px; }
                article { padding: 22px 0; border-bottom: 1px solid #2a3947; }
                article:last-child { border-bottom: 0; }
                .author { margin: 0 0 10px; font-weight: 650; color: #c0d2e2; }
                .text { margin: 0 0 14px; white-space: pre-wrap; overflow-wrap: anywhere; }
                a { color: #83cbff; text-decoration: none; overflow-wrap: anywhere; }
                a:hover { text-decoration: underline; }
                a:focus-visible, button:focus-visible { outline: 2px solid #83cbff; outline-offset: 4px; }
            </style>
            <dialog aria-labelledby="previous-posts-title">
                <header><div><h2 id="previous-posts-title">Posts before refresh</h2>
                    <p>The first posts from your previous feed</p></div>
                    <button class="close" type="button" aria-label="Close previous posts"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>
                <div class="posts"></div>
            </dialog>`;
        const list = shadow.querySelector('.posts');
        for (const post of recovery) {
            const article = document.createElement('article');
            const author = document.createElement('p');
            author.className = 'author';
            author.textContent = post.author;
            const text = document.createElement('p');
            text.className = 'text';
            text.textContent = post.text || 'This post contains media or has no text preview.';
            const link = document.createElement('a');
            link.href = post.url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = post.url;
            article.append(author, text, link);
            list.appendChild(article);
        }
        const dialog = shadow.querySelector('dialog');
        shadow.querySelector('.close').addEventListener('click', closePopup);
        dialog.addEventListener('cancel', (event) => { event.preventDefault(); closePopup(); });
        dialog.addEventListener('click', (event) => {
            if (event.target !== dialog) return;
            const rect = dialog.getBoundingClientRect();
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closePopup();
        });
        (document.body || document.documentElement).appendChild(popupHost);
        dialog.showModal();
    }

    function mountBanner(posts) {
        if (!host) return;
        const first = posts.find((post) => post.id === bannerPostId);
        if (!first || first.article.previousElementSibling === host) return;
        // Insert into the first post's normal flow so X can measure the taller cell.
        first.article.before(host);
        ignoreUntil = performance.now() + 250;
    }

    function showBanner(previousPosts, posts) {
        if (!previousPosts.length || !posts.length) return;
        dismiss();
        recovery = previousPosts.map((post) => ({ ...post }));
        bannerPostId = posts[0].id;
        host = document.createElement('div');
        host.id = 'toolkit-feed-return';
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
            <style>
                :host { all: initial; display: block; box-sizing: border-box; width: 100%; padding: 12px 16px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color-scheme: light dark; }
                .banner { display: flex; align-items: center; gap: 8px; padding: 6px; border-radius: 15px;
                    background: #152330; color: #f7fbff; border: 1px solid #43617a; animation: appear .2s ease-out; }
                button { font: inherit; color: inherit; border: 0; cursor: pointer; }
                .open { display: flex; flex: 1; align-items: center; gap: 12px; padding: 9px 12px;
                    border-radius: 13px; background: transparent; text-align: left; font-size: 14px; font-weight: 600; line-height: 1.4; }
                .open:hover { background: #ffffff12; }
                .icon { color: #83cbff; flex-shrink: 0; }
                .close { display: inline-flex; align-items: center; justify-content: center; padding: 0;
                    border-radius: 50%; background: transparent; width: 36px; height: 36px; flex-shrink: 0; }
                .close:hover { background: #ffffff18; }
                button:focus-visible { outline: 2px solid #83cbff; outline-offset: 2px; }
                @keyframes appear { from { opacity: 0; translate: 0 8px; } to { opacity: 1; translate: 0 0; } }
                @media (prefers-reduced-motion: reduce) { .banner { animation: none; } }
            </style>
            <div class="banner" role="status" aria-live="polite">
                <button class="open" type="button" aria-haspopup="dialog">
                    <svg class="icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5 3 11l6 6M3 11h11a6 6 0 0 1 6 6v2"/></svg>
                    <span>See posts that appeared before refresh</span>
                </button>
                <button class="close" type="button" aria-label="Dismiss previous posts banner"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
            </div>`;
        shadow.querySelector('.close').addEventListener('click', dismiss);
        shadow.querySelector('.open').addEventListener('click', openPopup);
        mountBanner(posts);
    }

    function check() {
        timer = null;
        const nextRoute = location.pathname + location.search;
        // A refresh can briefly remove the tab bar; that is not a tab switch.
        const nextTab = document.querySelector('[data-testid="primaryColumn"] [role="tab"][aria-selected="true"]')?.textContent.trim() || (nextRoute === route ? tab : '');
        if (nextRoute !== route || nextTab !== tab) {
            // Switching timeline tabs is intentional, not a lost reading position.
            if (nextRoute !== route || tab) {
                if (!manualRefresh) suppressManualRefresh();
                else dismiss();
            }
            anchor = null;
            feedSnapshot = [];
            route = nextRoute;
            tab = nextTab;
        }
        if (document.hidden) {
            anchor = null;
            return;
        }
        if (/\/status\/\d+|^\/(?:compose|messages|settings|notifications)(?:\/|$)/.test(location.pathname)) {
            anchor = null;
            dismiss();
            return;
        }
        const posts = getPosts();
        mountBanner(posts);
        const current = readingPost(posts);
        // Wait through empty intermediate renders rather than forgetting the old post.
        if (!current) return;
        if (manualRefresh) {
            const now = performance.now();
            if (now >= manualRefresh.expires || (manualRefresh.changed && now >= manualRefresh.quietUntil)) {
                manualRefresh = null;
            } else {
                const head = posts.slice(0, 3).map((post) => post.id).join(',');
                if (head !== manualRefresh.head) {
                    manualRefresh.head = head;
                    manualRefresh.changed = true;
                    manualRefresh.quietUntil = now + 1500;
                }
                updateSnapshot(posts, true);
                remember(current);
                return;
            }
        }
        const tracked = anchor;
        const scrolling = touching || scrollbarDragging || performance.now() <= ignoreUntil;
        let lost = false;
        if (tracked && !scrolling) {
            const previous = posts.find((post) => post.id === tracked.id);
            const displaced = previous && current.id !== tracked.id &&
                (previous.rect.bottom <= 80 || previous.rect.top >= innerHeight ||
                    Math.abs(previous.rect.top - tracked.top) > Math.max(120, innerHeight * 0.2));
            lost = !previous || displaced;
            if (lost) {
                showBanner(feedSnapshot, posts);
            }
        }
        updateSnapshot(posts, lost);
        // DOM updates must not overwrite the pre-refresh position in small steps.
        if (!anchor || scrolling || lost) remember(current);
    }

    function schedule() {
        // One scan per burst, even when the feed continuously mutates.
        if (timer === null) timer = setTimeout(check, 100);
    }

    function onScrollIntent() {
        ignoreUntil = performance.now() + 1000;
        schedule();
    }

    function suppressManualRefresh() {
        dismiss();
        manualRefresh = {
            head: getPosts().slice(0, 3).map((post) => post.id).join(','),
            changed: false, quietUntil: 0, expires: performance.now() + 15000,
        };
        anchor = null;
        feedSnapshot = [];
        schedule();
    }

    window.addEventListener('wheel', onScrollIntent, { passive: true });
    window.addEventListener('touchstart', () => { touching = true; onScrollIntent(); }, { passive: true });
    window.addEventListener('touchend', () => { touching = false; onScrollIntent(); }, { passive: true });
    window.addEventListener('touchcancel', () => { touching = false; onScrollIntent(); }, { passive: true });
    window.addEventListener('pointerdown', (event) => {
        scrollbarDragging = event.clientX >= document.documentElement.clientWidth;
        // Only scrollbar dragging and middle-click autoscroll imply scrolling.
        if (scrollbarDragging || event.button === 1) onScrollIntent();
    }, { passive: true });
    window.addEventListener('pointerup', () => { scrollbarDragging = false; }, { passive: true });
    document.addEventListener('click', (event) => {
        const control = event.target instanceof Element ? event.target.closest('a, [role="tab"], button, [role="button"]') : null;
        if (!control) return;
        const home = control.matches('a[href="/home"]');
        const inTimeline = !!control.closest('[data-testid="primaryColumn"]');
        const timelineRefresh = inTimeline && (control.matches('[role="tab"]') ||
            /^(?:see|show)\s+(?:[\d,]+\s+(?:new\s+)?|new\s+)(?:posts?|tweets?)$/i.test((control.innerText || control.textContent).trim()));
        if (home || timelineRefresh) suppressManualRefresh();
    }, true);
    window.addEventListener('keydown', (event) => {
        if (SCROLL_KEYS.has(event.key)) onScrollIntent();
        if (event.key === 'Escape') {
            if (popupHost) closePopup();
            else dismiss();
        }
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
    schedule();
})();
