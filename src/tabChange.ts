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

export const applyTabChange = (change: unknown, fallbackOriginal?: TabChange) => {
    if (typeof change !== 'object' || change === null || Array.isArray(change)) {
        return;
    }

    const originalTabStateKey = '__fakeTabOriginalState';
    type LinkAttributeSnapshot = Array<[string, string]>;
    type OriginalTabState = {
        iconLinks: LinkAttributeSnapshot[];
        title: string;
    };
    type FakeTabDocument = Document & {
        [originalTabStateKey]?: OriginalTabState;
    };
    const fakeTabDocument = document as FakeTabDocument;
    const captureOriginalTabState = () => {
        if (fakeTabDocument[originalTabStateKey]) {
            return;
        }

        const iconLinks = Array.from(
            document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]'),
            (link) =>
                Array.from(link.attributes, ({ name, value }) => [name, value] as [string, string]),
        );

        if (iconLinks.length === 0 && fallbackOriginal?.icon) {
            iconLinks.push([
                ['rel', 'icon'],
                ['href', fallbackOriginal.icon],
            ]);
        }

        fakeTabDocument[originalTabStateKey] = {
            iconLinks,
            title: document.title || fallbackOriginal?.title || '',
        };
    };
    const tabChange = change as { icon?: unknown; title?: unknown };

    captureOriginalTabState();

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

export const resetTabChange = () => {
    const originalTabStateKey = '__fakeTabOriginalState';
    type LinkAttributeSnapshot = Array<[string, string]>;
    type OriginalTabState = {
        iconLinks: LinkAttributeSnapshot[];
        title: string;
    };
    type FakeTabDocument = Document & {
        [originalTabStateKey]?: OriginalTabState;
    };
    const fakeTabDocument = document as FakeTabDocument;
    const originalState = fakeTabDocument[originalTabStateKey];
    const createIconLink = (attributes: LinkAttributeSnapshot) => {
        const link = document.createElement('link');

        for (const [name, value] of attributes) {
            link.setAttribute(name, value);
        }

        return link;
    };

    if (!originalState) {
        return false;
    }

    document.title = originalState.title;

    for (const iconLink of document.querySelectorAll<HTMLLinkElement>('link[rel~="icon"]')) {
        iconLink.remove();
    }

    for (const iconLinkAttributes of originalState.iconLinks) {
        document.head.appendChild(createIconLink(iconLinkAttributes));
    }

    delete fakeTabDocument[originalTabStateKey];

    return true;
};

const getSerializableTabChange = (change?: TabChange) => {
    const serializableChange: TabChange = {};

    if (typeof change?.title === 'string') {
        serializableChange.title = change.title;
    }

    if (typeof change?.icon === 'string') {
        serializableChange.icon = change.icon;
    }

    return serializableChange;
};

export const applyChangeToTab = async (
    tabId: number,
    change: TabChange,
    fallbackOriginal?: TabChange,
) => {
    await browser.scripting.executeScript({
        target: {
            tabId,
        },
        func: applyTabChange,
        args: [change, getSerializableTabChange(fallbackOriginal)],
    });
};

export const resetChangeInTab = async (tabId: number) => {
    const [resetResult] = await browser.scripting.executeScript({
        target: {
            tabId,
        },
        func: resetTabChange,
    });

    return Boolean(resetResult?.result);
};
