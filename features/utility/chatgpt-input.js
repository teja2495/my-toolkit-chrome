(function () {
    const PENDING_TEXT_KEY = 'chatgptPendingText';
    const MAX_RETRIES = 50;
    const RETRY_INTERVAL_MS = 200;

    function isUsablePrompt(el) {
        if (!el || !el.isConnected) return false;
        const r = el.getBoundingClientRect();
        return r.width > 2 && r.height > 2;
    }

    function findInputElement() {
        const selectors = [
            'div#prompt-textarea[contenteditable="true"]',
            'div#prompt-textarea[contenteditable="plaintext-only"]',
            'div#prompt-textarea.ProseMirror[contenteditable]',
            '[data-testid="prompt-textarea"][contenteditable="true"]',
            '[data-testid="prompt-textarea"][contenteditable="plaintext-only"]',
        ];
        for (const sel of selectors) {
            const el = document.querySelector(sel);
            if (isUsablePrompt(el)) return el;
        }

        const byId = document.querySelector('div#prompt-textarea[contenteditable]');
        if (isUsablePrompt(byId)) return byId;

        const byTestId = document.querySelector('[data-testid="prompt-textarea"]');
        if (byTestId) {
            const ce = byTestId.getAttribute('contenteditable');
            const inner =
                ce && ce !== 'false'
                    ? byTestId
                    : byTestId.querySelector('[contenteditable="true"], [contenteditable="plaintext-only"]');
            if (isUsablePrompt(inner)) return inner;
        }

        // Fallbacks in case ChatGPT changes composer markup.
        const fallbacks = [
            'form .ProseMirror[contenteditable]:not([contenteditable="false"])',
            'textarea[name="prompt-textarea"]',
            'form [contenteditable="true"]',
            'form textarea',
        ];
        for (const sel of fallbacks) {
            const el = document.querySelector(sel);
            if (isUsablePrompt(el)) return el;
        }

        return null;
    }

    function getInputText(el) {
        if (!el) return '';
        return (el.tagName === 'TEXTAREA' ? el.value : el.innerText) || '';
    }

    function insertTextIntoInput(inputEl, text) {
        inputEl.focus();
        inputEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });

        try {
            if (document.execCommand('insertText', false, text)) {
                return;
            }
        } catch {
            // continue to paste fallback
        }

        const dataTransfer = new DataTransfer();
        dataTransfer.setData('text/plain', text);
        inputEl.dispatchEvent(
            new ClipboardEvent('paste', {
                clipboardData: dataTransfer,
                bubbles: true,
                cancelable: true,
            })
        );
    }

    function clickSubmitButton(attempt = 0) {
        const button =
            document.querySelector('#composer-submit-button') ||
            document.querySelector('button[data-testid="send-button"]') ||
            document.querySelector('form button[aria-label*="Send" i]');
        const inputEl = findInputElement();
        const hasPromptText = getInputText(inputEl).trim();

        if (
            button &&
            hasPromptText &&
            !button.disabled &&
            button.getAttribute('aria-disabled') !== 'true'
        ) {
            button.click();
            return;
        }

        // No send button at all: don't wait, just press Enter.
        if (!button && hasPromptText && attempt >= 2) {
            pressEnter(inputEl);
            return;
        }

        if (attempt < 20) {
            setTimeout(() => clickSubmitButton(attempt + 1), 100);
            return;
        }

        // Send button never became clickable: fall back to Enter.
        if (inputEl && hasPromptText) pressEnter(inputEl);
    }

    function pressEnter(inputEl) {
        const opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true };
        inputEl.dispatchEvent(new KeyboardEvent('keydown', opts));
        inputEl.dispatchEvent(new KeyboardEvent('keyup', opts));
    }

    function getPromptFromUrl() {
        return new URLSearchParams(window.location.search).get('prompt')?.trim() || '';
    }

    function textLanded(text) {
        const probe = text.slice(-30).trim().replace(/\s+/g, ' ');
        const current = getInputText(findInputElement()).replace(/\s+/g, ' ');
        return !!probe && current.includes(probe);
    }

    // ChatGPT can re-render the composer during hydration and wipe inserted
    // text, so verify it stuck before clearing storage and submitting.
    function tryInsert(text, attempt = 0) {
        const retry = () => {
            if (attempt < MAX_RETRIES) {
                setTimeout(() => tryInsert(text, attempt + 1), RETRY_INTERVAL_MS);
            }
        };

        const inputEl = findInputElement();
        if (!inputEl) {
            retry();
            return;
        }

        requestAnimationFrame(() => {
            if (!textLanded(text)) insertTextIntoInput(inputEl, text);
            setTimeout(() => {
                if (!textLanded(text)) {
                    retry();
                    return;
                }
                chrome.storage.local.remove(PENDING_TEXT_KEY);
                clickSubmitButton();
            }, 150);
        });
    }

    const PREFIX_TEXT =
        'Rewrite this for posting on twitter:\n\n';

    async function checkForPendingText() {
        const result = await chrome.storage.local.get(PENDING_TEXT_KEY);
        const text = result[PENDING_TEXT_KEY];
        if (!text) {
            if (getPromptFromUrl()) {
                clickSubmitButton();
            }
            return;
        }

        tryInsert(PREFIX_TEXT + text);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForPendingText);
    } else {
        checkForPendingText();
    }
}());
