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

        return null;
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
            document.querySelector('button[data-testid="send-button"]');
        const inputEl = findInputElement();
        const hasPromptText = inputEl && inputEl.innerText.trim();

        if (
            button &&
            hasPromptText &&
            !button.disabled &&
            button.getAttribute('aria-disabled') !== 'true'
        ) {
            button.click();
            return;
        }

        if (attempt < 25) {
            setTimeout(() => clickSubmitButton(attempt + 1), 200);
        }
    }

    function getPromptFromUrl() {
        return new URLSearchParams(window.location.search).get('prompt')?.trim() || '';
    }

    function tryInsert(text, attempt = 0) {
        const inputEl = findInputElement();

        if (inputEl) {
            requestAnimationFrame(() => {
                insertTextIntoInput(inputEl, text);
                setTimeout(() => clickSubmitButton(), 700);
            });
            return;
        }

        if (attempt < MAX_RETRIES) {
            setTimeout(() => tryInsert(text, attempt + 1), RETRY_INTERVAL_MS);
        }
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

        await chrome.storage.local.remove(PENDING_TEXT_KEY);
        tryInsert(PREFIX_TEXT + text);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkForPendingText);
    } else {
        checkForPendingText();
    }
}());
