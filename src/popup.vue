<template>
    <v-container class="popup">
        <header class="popup__header">
            <span class="popup__brand-icon-wrap" aria-hidden="true">
                <img class="popup__brand-icon" src="./assets/icon_32.png" alt="" />
            </span>
            <h1>Fake Tab</h1>
        </header>

        <v-form class="popup__form" @submit.prevent="changeTab">
            <section class="popup__templates" aria-label="Preset templates">
                <div class="popup__section-title">Presets</div>

                <div class="popup__template-grid">
                    <button
                    v-for="template in tabPresetTemplates"
                    :key="template.id"
                    type="button"
                    class="popup__template-button"
                    :class="{
                        'popup__template-button--active': selectedPresetId === template.id,
                    }"
                    :aria-label="`Apply ${template.label} preset`"
                    :aria-pressed="selectedPresetId === template.id"
                    :disabled="activeTabId === undefined || isApplying"
                    @click="applyTemplate(template)">
                        <span class="popup__template-icon" aria-hidden="true">
                            <v-img :src="template.icon" width="18" height="18" cover />
                        </span>
                        <span class="popup__template-label">{{ template.label }}</span>
                    </button>
                </div>
            </section>

            <v-text-field
            v-model="originalIcon"
            label="Icon URL"
            placeholder="https://example.com/favicon.ico"
            density="compact"
            variant="outlined"
            color="primary"
            class="popup__field"
            hide-details>
                <template #prepend-inner>
                    <span class="popup__icon-preview" aria-label="Current tab icon">
                        <v-img
                        v-if="originalIcon"
                        :src="originalIcon"
                        width="22"
                        height="22"
                        cover />
                        <span v-else class="popup__icon-preview-empty">FT</span>
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
            class="popup__field"
            hide-details></v-text-field>

            <label class="popup__persist-control">
                <input v-model="persistTab" type="checkbox" @change="persistTabTouched = true" />
                <span>Keep for this tab after refresh</span>
            </label>

            <div class="popup__actions">
                <v-btn
                type="button"
                size="small"
                variant="outlined"
                color="primary"
                class="popup__reset-button"
                :disabled="isApplying"
                @click="resetTab">Reset</v-btn>

                <v-btn
                type="submit"
                size="small"
                variant="flat"
                color="primary"
                class="popup__submit-button"
                :disabled="isApplying">Apply changes</v-btn>
            </div>
        </v-form>
    </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import browser from 'webextension-polyfill';

import {
    applyChangeToTab,
    getPersistableTabOrigin,
    getPersistedTabChange,
    removePersistedTabChange,
    resetChangeInTab,
    setPersistedTabChange,
    tabPresetTemplates,
    type TabPresetId,
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
const isApplying = ref(false);

type TabPresetTemplateItem = (typeof tabPresetTemplates)[number];

type PageTabInfo = {
    icon?: string;
    title?: string;
};

const getFormTabChange = () => {
    const change: TabChange = {};

    if (typeof originalTitle.value === 'string') {
        change.title = originalTitle.value;
    }

    change.icon = typeof originalIcon.value === 'string' ? originalIcon.value : '';

    return change;
};

const getMatchingPresetId = (change: TabChange): TabPresetId | undefined =>
    tabPresetTemplates.find(
        (template) => template.title === change.title && template.icon === change.icon,
    )?.id;

const selectedPresetId = computed(() => getMatchingPresetId(getFormTabChange()));

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
    const emptyIcon = document.querySelector('link[data-fake-tab-empty-icon]');
    const icon = document.querySelector<HTMLLinkElement>(iconSelector)?.href;
    const info: PageTabInfo = {};

    if (document.title) {
        info.title = document.title;
    }

    if (emptyIcon) {
        info.icon = '';
        return info;
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
        const hasPageIcon = Object.prototype.hasOwnProperty.call(result ?? {}, 'icon');

        return {
            title: tabInfo.title ?? result?.title,
            icon: hasPageIcon ? result?.icon : tabInfo.icon,
        };
    } catch {
        return tabInfo;
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

const commitTabChange = async (change: TabChange, presetId = getMatchingPresetId(change)) => {
    const tabId = activeTabId.value;
    const origin = activeTabOrigin.value;

    if (tabId === undefined) {
        return;
    }

    const shouldPersist = persistTab.value && Boolean(origin);

    isApplying.value = true;

    try {
        await applyChangeToTab(tabId, change, getPageTabChange());

        if (shouldPersist && origin) {
            await setPersistedTabChange(tabId, {
                ...change,
                origin,
                ...(presetId ? { presetId } : {}),
            });
            return;
        }

        await removePersistedTabChange(tabId).catch(() => undefined);
    } finally {
        isApplying.value = false;
    }
};

const changeTab = async () => {
    await commitTabChange(getFormTabChange(), selectedPresetId.value);
};

const applyTemplate = async (template: TabPresetTemplateItem) => {
    const change = {
        title: template.title,
        icon: template.icon,
    };

    originalTitle.value = change.title;
    originalIcon.value = change.icon;

    await commitTabChange(change, template.id);
};

const resetTab = async () => {
    const tabId = activeTabId.value;

    if (tabId === undefined) {
        return;
    }

    isApplying.value = true;

    try {
        await removePersistedTabChange(tabId).catch(() => undefined);
        persistTab.value = false;
        persistTabTouched.value = false;
        await resetChangeInTab(tabId).catch(() => false);
        await getTabInfo();
    } finally {
        isApplying.value = false;
    }
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

.popup {
    padding: 0;
    overflow: hidden;
    background: rgb(var(--v-theme-background));

    &__header {
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 40px;
        padding: 7px 12px;
        background: rgb(var(--v-theme-primary));
        color: rgb(var(--v-theme-on-primary));

        h1 {
            margin: 0;
            color: inherit;
            font-size: 14px;
            font-weight: 650;
            line-height: 1;
            letter-spacing: 0;
        }
    }

    &__brand-icon-wrap {
        display: inline-flex;
        width: 24px;
        height: 24px;
        align-items: center;
        justify-content: center;
        flex: 0 0 24px;
        border-radius: 6px;
        background: rgba(var(--v-theme-on-primary), 0.16);
    }

    &__brand-icon {
        width: 18px;
        height: 18px;
        display: block;
    }

    &__form {
        display: grid;
        gap: 8px;
        padding: 12px;
    }

    &__templates {
        display: grid;
        gap: 6px;
    }

    &__section-title {
        color: rgb(var(--v-theme-muted));
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        text-transform: uppercase;
    }

    &__template-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
    }

    &__template-button {
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        min-width: 0;
        min-height: 32px;
        align-items: center;
        gap: 6px;
        padding: 5px 7px;
        border: 1px solid rgb(var(--v-theme-border));
        border-radius: 6px;
        background: rgb(var(--v-theme-surface));
        color: rgb(var(--v-theme-on-surface));
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        text-align: left;
        transition:
            background-color 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;

        &:hover:not(:disabled) {
            border-color: rgb(var(--v-theme-primary));
            background: rgba(var(--v-theme-primary), 0.06);
        }

        &:disabled {
            cursor: default;
            opacity: 0.58;
        }

        &--active {
            border-color: rgb(var(--v-theme-primary));
            box-shadow: 0 0 0 2px rgb(var(--v-theme-secondary));
        }
    }

    &__template-icon {
        display: inline-flex;
        width: 18px;
        height: 18px;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: 4px;
    }

    &__template-label {
        min-width: 0;
        overflow: hidden;
        font-weight: 650;
        line-height: 1.2;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &__field {
        min-width: 0;
    }

    &__persist-control {
        display: inline-flex;
        min-height: 28px;
        align-items: center;
        gap: 8px;
        width: fit-content;
        color: rgb(var(--v-theme-on-surface));
        cursor: pointer;
        font-size: 12px;
        user-select: none;

        input {
            width: 15px;
            height: 15px;
            margin: 0;
            accent-color: rgb(var(--v-theme-primary));
            cursor: pointer;
        }
    }

    &__icon-preview {
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

        .v-img {
            width: 100%;
            height: 100%;
        }
    }

    &__icon-preview-empty {
        color: rgb(var(--v-theme-muted));
        font-size: 10px;
        font-weight: 800;
        line-height: 1;
    }

    &__actions {
        display: grid;
        grid-template-columns: minmax(82px, 0.6fr) minmax(0, 1fr);
        gap: 8px;
    }

    &__reset-button,
    &__submit-button {
        min-height: 32px;
        border-radius: 6px;
        font-weight: 650;
        letter-spacing: 0;
        text-transform: none;
        box-shadow: none;
        transition:
            background-color 160ms ease;
    }

    &__submit-button:hover {
        background: rgb(var(--v-theme-primary-hover));
    }

    .v-field {
        min-height: 34px;
        border-radius: 6px;
        background: rgb(var(--v-theme-surface));
        box-shadow: none;
        transition:
            box-shadow 160ms ease,
            background-color 160ms ease;
    }

    .v-field__input {
        min-height: 34px;
        padding-top: 4px;
        padding-bottom: 4px;
        font-size: 12px;
    }

    .v-field__prepend-inner {
        padding-top: 5px;
    }

    .v-field__outline {
        color: rgb(var(--v-theme-border));
        opacity: 1;
    }

    .v-field--focused {
        background: rgb(var(--v-theme-surface));
        box-shadow: 0 0 0 2px rgb(var(--v-theme-secondary));

        .v-field__outline {
            color: rgb(var(--v-theme-primary));
        }

        .v-label,
        .v-field-label {
            color: rgb(var(--v-theme-primary));
        }
    }

    .v-label,
    .v-field-label {
        color: rgb(var(--v-theme-muted));
        font-size: 12px;
    }
}
</style>
