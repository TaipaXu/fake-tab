import browser from 'webextension-polyfill';

import {
    applyChangeToTab,
    getPersistedTabChange,
    isPersistedTabChangeForUrl,
    removePersistedTabChange,
} from './tabChange';

const reapplyPersistedTabChange = async (tabId: number, url?: string) => {
    const change = await getPersistedTabChange(tabId);

    if (!change) {
        return;
    }

    if (!isPersistedTabChangeForUrl(change, url)) {
        await removePersistedTabChange(tabId);
        return;
    }

    await applyChangeToTab(tabId, change);
};

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete') {
        return;
    }

    void reapplyPersistedTabChange(tabId, tab.url).catch(() => undefined);
});

browser.tabs.onRemoved.addListener((tabId) => {
    void removePersistedTabChange(tabId);
});
