const ICONS = (prefix) => ({
    "16": `${prefix}16.png`,
    "48": `${prefix}48.png`,
    "64": `${prefix}64.png`,
    "128": `${prefix}128.png`
});

chrome.runtime.onMessage.addListener(({ action, wsCount, weirdCount }, sender) => {
    if (action === 'updateBadge') {
        const prefix = wsCount > 0 ? 'icon-red'
            : weirdCount > 0 ? 'icon-orange'
                : 'icon';
        chrome.action.setIcon({ path: ICONS(prefix), tabId: sender.tab.id });
    }
});

chrome.action.onClicked.addListener(tab =>
    chrome.tabs.sendMessage(tab.id, { action: 'highlightSpaces' }, () => {
        if (chrome.runtime.lastError) {
            console.warn('Could not reach tab:', chrome.runtime.lastError.message);
        }
    })
);
