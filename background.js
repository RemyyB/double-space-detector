const ICONS = (prefix) => ({
    "16": `${prefix}16.png`,
    "48": `${prefix}48.png`,
    "64": `${prefix}64.png`,
    "128": `${prefix}128.png`
});

chrome.runtime.onMessage.addListener(({ action, count }, sender) => {
    if (action === 'updateBadge') {
        chrome.action.setIcon({
            path: ICONS(count > 0 ? 'icon-red' : 'icon'),
            tabId: sender.tab.id
        });
    }
});

chrome.action.onClicked.addListener(tab =>
    chrome.tabs.sendMessage(tab.id, { action: 'highlightSpaces' })
);
