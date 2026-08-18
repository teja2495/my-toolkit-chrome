const CLOSE_OTHER_TABS_MENU_ID = 'close-other-tabs';
const CLOSE_OTHER_TABS_COMMAND_ID = 'close-other-tabs-shortcut';

async function closeOtherTabs(activeTabId) {
    if (!activeTabId) {
        return;
    }

    const allTabs = await chrome.tabs.query({});
    const tabsToClose = allTabs
        .filter(
            (openTab) =>
                openTab.id && openTab.id !== activeTabId && !openTab.pinned
        )
        .map((openTab) => openTab.id);

    if (tabsToClose.length > 0) {
        await chrome.tabs.remove(tabsToClose);
    }
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: CLOSE_OTHER_TABS_MENU_ID,
        title: 'Close Other Tabs',
        contexts: ['all']
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === CLOSE_OTHER_TABS_MENU_ID && tab?.id) {
        await closeOtherTabs(tab.id);

        return;
    }

});

chrome.commands.onCommand.addListener(async (command) => {
    if (command !== CLOSE_OTHER_TABS_COMMAND_ID) {
        return;
    }

    const [activeTab] = await chrome.tabs.query({
        active: true,
        lastFocusedWindow: true
    });

    await closeOtherTabs(activeTab?.id);
});

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message?.action === 'closeCurrentTab') {
        if (!sender.tab?.id) {
            return;
        }

        chrome.tabs.remove(sender.tab.id).catch(() => {
            // Ignore failures if the tab has already been closed.
        });
        return;
    }

    if (message?.action === 'closeOtherTabs') {
        closeOtherTabs(sender.tab?.id).catch(() => {
            // Ignore failures from stale tab state.
        });
        return;
    }

    if (message?.action === 'openClaude') {
        chrome.tabs.create({ url: 'https://claude.ai/new' });
        return;
    }

    if (message?.action === 'openChatGPT') {
        chrome.tabs.create({ url: 'https://chatgpt.com/' });
    }
});
