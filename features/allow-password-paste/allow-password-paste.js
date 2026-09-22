(() => {
    const settingKey = 'allowPasswordPaste.enabled';
    let enabled = true;

    chrome.storage.sync.get({ [settingKey]: true }, (settings) => {
        enabled = settings[settingKey] !== false;
    });

    chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === 'sync' && changes[settingKey]) {
            enabled = changes[settingKey].newValue !== false;
        }
    });

    function isPasswordField(target) {
        if (!(target instanceof Element)) return false;
        const field = target.closest('input, textarea');
        return field instanceof HTMLInputElement && (
            field.type.toLowerCase() === 'password' ||
            field.getAttribute('role')?.toLowerCase() === 'password'
        );
    }

    window.addEventListener('paste', (event) => {
        if (!enabled || !isPasswordField(event.target)) return;

        // Keep the browser's default paste action, but skip page handlers that cancel it.
        event.stopImmediatePropagation();
    }, true);
})();
