import browser from 'webextension-polyfill';

import {
    applyChangeToTab,
    getPersistedTabChange,
    isPersistedTabChangeForUrl,
    removePersistedTabChange,
    type PersistedTabChange,
} from './tabChange';

const isEmptyTabIconUrl = (url?: string) =>
    typeof url === 'string' &&
    url.startsWith('data:image/svg+xml') &&
    url.includes('width=%2216%22') &&
    url.includes('height=%2216%22');

const isPersistedIconAlreadyApplied = (
    change: PersistedTabChange,
    favIconUrl: string | undefined,
) => {
    if (typeof change.icon !== 'string' || favIconUrl === undefined) {
        return false;
    }

    return change.icon ? favIconUrl === change.icon : isEmptyTabIconUrl(favIconUrl);
};

const reapplyPersistedTabChange = async (
    tabId: number,
    tab: browser.Tabs.Tab,
    changedFavIconUrl?: string,
) => {
    const change = await getPersistedTabChange(tabId);

    if (!change) {
        return;
    }

    if (!isPersistedTabChangeForUrl(change, tab.url)) {
        await removePersistedTabChange(tabId);
        return;
    }

    if (isPersistedIconAlreadyApplied(change, changedFavIconUrl)) {
        return;
    }

    await applyChangeToTab(tabId, change, {
        icon: tab.favIconUrl,
        title: tab.title,
    });
};

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status !== 'complete' && changeInfo.favIconUrl === undefined) {
        return;
    }

    void reapplyPersistedTabChange(tabId, tab, changeInfo.favIconUrl).catch(() => undefined);
});

browser.tabs.onRemoved.addListener((tabId) => {
    void removePersistedTabChange(tabId);
});
