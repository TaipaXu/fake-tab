import browser from 'webextension-polyfill';

export type TabChange = {
    icon?: string;
    title?: string;
};

export type PersistedTabChange = TabChange & {
    origin?: string;
};

type PersistedTabChanges = Record<string, PersistedTabChange>;
type StorageArea = Pick<chrome.storage.StorageArea, 'get' | 'set'>;

const persistedTabChangesStorageKey = 'fakeTabPersistentChanges';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const getStorageArea = (): StorageArea => {
    const storage = chrome.storage as typeof chrome.storage & {
        session?: StorageArea;
    };

    return storage.session ?? storage.local;
};

const normalizeTabChange = (value: unknown): PersistedTabChange | undefined => {
    if (!isRecord(value)) {
        return undefined;
    }

    const change: PersistedTabChange = {};
    let hasTabChange = false;

    if (typeof value.title === 'string') {
        change.title = value.title;
        hasTabChange = true;
    }

    if (typeof value.icon === 'string') {
        change.icon = value.icon;
        hasTabChange = true;
    }

    if (typeof value.origin === 'string') {
        change.origin = value.origin;
    }

    return hasTabChange ? change : undefined;
};

const getPersistedTabChanges = async (): Promise<PersistedTabChanges> => {
    const storedValue = await getStorageArea().get({
        [persistedTabChangesStorageKey]: {},
    });
    const persistedChanges = storedValue[persistedTabChangesStorageKey];

    if (!isRecord(persistedChanges)) {
        return {};
    }

    const changes: PersistedTabChanges = {};

    for (const [tabId, persistedChange] of Object.entries(persistedChanges)) {
        const change = normalizeTabChange(persistedChange);

        if (change) {
            changes[tabId] = change;
        }
    }

    return changes;
};

export const getPersistedTabChange = async (tabId: number) => {
    const changes = await getPersistedTabChanges();

    return changes[String(tabId)];
};

export const setPersistedTabChange = async (tabId: number, change: PersistedTabChange) => {
    const changes = await getPersistedTabChanges();

    changes[String(tabId)] = change;

    await getStorageArea().set({
        [persistedTabChangesStorageKey]: changes,
    });
};

export const removePersistedTabChange = async (tabId: number) => {
    const changes = await getPersistedTabChanges();
    const tabKey = String(tabId);

    if (!(tabKey in changes)) {
        return;
    }

    delete changes[tabKey];

    await getStorageArea().set({
        [persistedTabChangesStorageKey]: changes,
    });
};

export const getPersistableTabOrigin = (url?: string) => {
    if (!url) {
        return undefined;
    }

    try {
        const tabUrl = new URL(url);

        if (tabUrl.protocol !== 'http:' && tabUrl.protocol !== 'https:') {
            return undefined;
        }

        return tabUrl.origin;
    } catch {
        return undefined;
    }
};

export const getHostPermissionPattern = (origin?: string) => {
    if (!origin) {
        return undefined;
    }

    return `${origin}/*`;
};

export const isPersistedTabChangeForUrl = (change: PersistedTabChange, url?: string) => {
    if (!change.origin) {
        return true;
    }

    const origin = getPersistableTabOrigin(url);

    return origin === undefined || origin === change.origin;
};

export const applyTabChange = (change: unknown) => {
    if (typeof change !== 'object' || change === null || Array.isArray(change)) {
        return;
    }

    const tabChange = change as { icon?: unknown; title?: unknown };

    if (typeof tabChange.title === 'string') {
        document.title = tabChange.title;
    }

    if (typeof tabChange.icon !== 'string' || !tabChange.icon) {
        return;
    }

    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/x-icon';
    link.href = tabChange.icon;

    for (const iconLink of document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')) {
        iconLink.remove();
    }

    document.head.appendChild(link);
};

export const applyChangeToTab = async (tabId: number, change: TabChange) => {
    await browser.scripting.executeScript({
        target: {
            tabId,
        },
        func: applyTabChange,
        args: [change],
    });
};
