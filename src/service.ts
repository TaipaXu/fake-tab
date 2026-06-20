import browser from 'webextension-polyfill';

import {
    applyChangeToTab,
    getPersistedTabChange,
    isPersistedTabChangeForUrl,
    removePersistedTabChange,
} from './tabChange';

const reapplyPersistedTabChange = async (tabId: number, tab: browser.Tabs.Tab) => {
    const change = await getPersistedTabChange(tabId);

    if (!change) {
        return;
    }

    if (!isPersistedTabChangeForUrl(change, tab.url)) {
        await removePersistedTabChange(tabId);
        return;
    }

    await applyChangeToTab(tabId, change, {
        icon: tab.favIconUrl,
        title: tab.title,
    });
};

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') {
        return;
    }

    void reapplyPersistedTabChange(tabId, tab).catch(() => undefined);
});

browser.tabs.onRemoved.addListener((tabId) => {
    void removePersistedTabChange(tabId);
});
