<template>
    <v-container class="popup-shell">
        <header class="popup-header">
            <span class="brand-icon-wrap" aria-hidden="true">
                <img class="brand-icon" src="./assets/icon_32.png" alt="" />
            </span>
            <h1>Fake Tab</h1>
        </header>

        <v-form class="tab-form" @submit.prevent="changeTab">
            <v-text-field
            v-model="originalIcon"
            label="Icon URL"
            placeholder="https://example.com/favicon.ico"
            density="compact"
            variant="outlined"
            color="primary"
            class="tab-field"
            hide-details>
                <template #prepend-inner>
                    <span class="icon-preview" aria-label="Current tab icon">
                        <v-img
                        v-if="originalIcon"
                        :src="originalIcon"
                        width="22"
                        height="22"
                        cover />
                        <span v-else class="icon-preview-empty">FT</span>
                    </span>
                </template>
            </v-text-field>

            <v-text-field
            v-model="originalTitle"
            label="Title"
            placeholder="New tab title"
            variant="outlined"
            color="primary"
            density="compact"
            class="tab-field"
            hide-details></v-text-field>

            <label class="persist-control">
                <input v-model="persistTab" type="checkbox" @change="persistTabTouched = true" />
                <span>Keep after refresh</span>
            </label>

            <div class="form-actions">
                <v-btn
                type="button"
                size="small"
                variant="outlined"
                color="primary"
                class="reset-button"
                @click="resetTab">Reset</v-btn>

                <v-btn
                type="submit"
                size="small"
                variant="flat"
                color="primary"
                class="submit-button">Apply changes</v-btn>
            </div>
        </v-form>
    </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import browser from 'webextension-polyfill';

import {
    applyChangeToTab,
    getHostPermissionPattern,
    getPersistableTabOrigin,
    getPersistedTabChange,
    removePersistedTabChange,
    resetChangeInTab,
    setPersistedTabChange,
    type TabChange,
} from './tabChange';

const originalIcon = ref<string>();
const originalTitle = ref<string>();
const pageIcon = ref<string>();
const pageTitle = ref<string>();
const persistTab = ref(false);
const persistTabTouched = ref(false);
const activeTabId = ref<number>();
const activeTabOrigin = ref<string>();

type PageTabInfo = {
    icon?: string;
    title?: string;
};

const getFormTabChange = () => {
    const change: TabChange = {};

    if (typeof originalTitle.value === 'string') {
        change.title = originalTitle.value;
    }

    if (typeof originalIcon.value === 'string') {
        change.icon = originalIcon.value;
    }

    return change;
};

const getPageTabChange = () => {
    const change: TabChange = {};

    if (typeof pageTitle.value === 'string') {
        change.title = pageTitle.value;
    }

    if (typeof pageIcon.value === 'string') {
        change.icon = pageIcon.value;
    }

    return change;
};

const readPageTabInfo = (): PageTabInfo => {
    const iconSelector = [
        'link[rel~="icon"]',
        'link[rel="shortcut icon"]',
        'link[rel="apple-touch-icon"]',
    ].join(',');
    const icon = document.querySelector<HTMLLinkElement>(iconSelector)?.href;
    const info: PageTabInfo = {};

    if (document.title) {
        info.title = document.title;
    }

    if (icon) {
        info.icon = icon;
    }

    return info;
};

const getPageTabInfo = async (tabId: number, currentTab: browser.Tabs.Tab) => {
    const tabInfo: PageTabInfo = {};

    if (currentTab.title) {
        tabInfo.title = currentTab.title;
    }

    if (currentTab.favIconUrl) {
        tabInfo.icon = currentTab.favIconUrl;
    }

    try {
        const [pageInfo] = await browser.scripting.executeScript({
            target: {
                tabId,
            },
            func: readPageTabInfo,
        });
        const result = pageInfo?.result as PageTabInfo | undefined;

        return {
            title: tabInfo.title ?? result?.title,
            icon: tabInfo.icon ?? result?.icon,
        };
    } catch {
        return tabInfo;
    }
};

const requestPersistentTabAccess = async (origin?: string) => {
    const originPattern = getHostPermissionPattern(origin);

    if (!originPattern) {
        return false;
    }

    const permission = {
        origins: [originPattern],
    };

    try {
        return await browser.permissions.request(permission);
    } catch {
        return false;
    }
};

const getTabInfo = async () => {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    const tabId = currentTab?.id;

    if (!currentTab || tabId === undefined) {
        return;
    }

    activeTabId.value = tabId;
    activeTabOrigin.value = getPersistableTabOrigin(currentTab.url);

    const pageInfo = await getPageTabInfo(tabId, currentTab);

    pageTitle.value = pageInfo.title;
    pageIcon.value = pageInfo.icon;
    originalTitle.value = pageInfo.title;
    originalIcon.value = pageInfo.icon;

    try {
        const persistedChange = await getPersistedTabChange(tabId);

        if (!persistTabTouched.value) {
            persistTab.value = Boolean(persistedChange);
        }

        originalTitle.value = persistedChange?.title ?? pageInfo.title;
        originalIcon.value = persistedChange?.icon ?? pageInfo.icon;
    } catch {
        if (!persistTabTouched.value) {
            persistTab.value = false;
        }
    }
};

void getTabInfo();

const changeTab = async () => {
    const tabId = activeTabId.value;

    if (tabId === undefined) {
        return;
    }

    const change = getFormTabChange();
    const shouldPersist =
        persistTab.value && (await requestPersistentTabAccess(activeTabOrigin.value));

    await applyChangeToTab(tabId, change, getPageTabChange());

    if (shouldPersist) {
        await setPersistedTabChange(tabId, {
            ...change,
            origin: activeTabOrigin.value,
        });
        return;
    }

    await removePersistedTabChange(tabId).catch(() => undefined);
};

const resetTab = async () => {
    const tabId = activeTabId.value;

    if (tabId === undefined) {
        return;
    }

    await removePersistedTabChange(tabId).catch(() => undefined);
    persistTab.value = false;
    persistTabTouched.value = false;
    await resetChangeInTab(tabId).catch(() => false);
    await getTabInfo();
};
</script>

<style lang="scss">
:root {
    color-scheme: light dark;
}

html,
body {
    margin: 0;
    background: rgb(var(--v-theme-background));
}

#app {
    width: 300px;
    background: rgb(var(--v-theme-background));
    color: rgb(var(--v-theme-on-surface));
    font-family:
        Inter,
        ui-sans-serif,
        system-ui,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
}

.popup-shell {
    padding: 0;
    overflow: hidden;
    background: rgb(var(--v-theme-background));
}

.popup-header {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 7px 12px;
    background: rgb(var(--v-theme-primary));
    color: rgb(var(--v-theme-on-primary));
}

.brand-icon-wrap {
    display: inline-flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    flex: 0 0 24px;
    border-radius: 6px;
    background: rgba(var(--v-theme-on-primary), 0.16);
}

.brand-icon {
    width: 18px;
    height: 18px;
    display: block;
}

.popup-header h1 {
    margin: 0;
    color: inherit;
    font-size: 14px;
    font-weight: 650;
    line-height: 1;
    letter-spacing: 0;
}

.tab-form {
    display: grid;
    gap: 8px;
    padding: 12px;
}

.tab-field {
    min-width: 0;
}

.persist-control {
    display: inline-flex;
    min-height: 28px;
    align-items: center;
    gap: 8px;
    width: fit-content;
    color: rgb(var(--v-theme-on-surface));
    cursor: pointer;
    font-size: 12px;
    user-select: none;
}

.persist-control input {
    width: 15px;
    height: 15px;
    margin: 0;
    accent-color: rgb(var(--v-theme-primary));
    cursor: pointer;
}

.icon-preview {
    display: inline-flex;
    width: 22px;
    height: 22px;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-left: -2px;
    margin-right: 0;
    border: 1px solid rgb(var(--v-theme-border));
    border-radius: 5px;
    background: rgb(var(--v-theme-icon-preview-background));
}

.icon-preview-empty {
    color: rgb(var(--v-theme-muted));
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
}

.icon-preview .v-img {
    width: 100%;
    height: 100%;
}

.form-actions {
    display: grid;
    grid-template-columns: minmax(82px, 0.6fr) minmax(0, 1fr);
    gap: 8px;
}

.popup-shell .v-field {
    min-height: 34px;
    border-radius: 6px;
    background: rgb(var(--v-theme-surface));
    box-shadow: none;
    transition:
        box-shadow 160ms ease,
        background-color 160ms ease;
}

.popup-shell .v-field__input {
    min-height: 34px;
    padding-top: 4px;
    padding-bottom: 4px;
    font-size: 12px;
}

.popup-shell .v-field__prepend-inner {
    padding-top: 5px;
}

.popup-shell .v-field__outline {
    color: rgb(var(--v-theme-border));
    opacity: 1;
}

.popup-shell .v-field--focused {
    background: rgb(var(--v-theme-surface));
    box-shadow: 0 0 0 2px rgb(var(--v-theme-secondary));
}

.popup-shell .v-field--focused .v-field__outline {
    color: rgb(var(--v-theme-primary));
}

.popup-shell .v-label,
.popup-shell .v-field-label {
    color: rgb(var(--v-theme-muted));
    font-size: 12px;
}

.popup-shell .v-field--focused .v-label,
.popup-shell .v-field--focused .v-field-label {
    color: rgb(var(--v-theme-primary));
}

.reset-button,
.submit-button {
    min-height: 32px;
    border-radius: 6px;
    font-weight: 650;
    letter-spacing: 0;
    text-transform: none;
    box-shadow: none;
    transition:
        background-color 160ms ease;
}

.submit-button:hover {
    background: rgb(var(--v-theme-primary-hover));
}
</style>
