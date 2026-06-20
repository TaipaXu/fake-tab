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

            <v-btn
            type="submit"
            block
            size="small"
            variant="flat"
            color="primary"
            class="submit-button">Apply changes</v-btn>
        </v-form>
    </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import browser from 'webextension-polyfill';

type ChangeTabMessage = {
    icon?: string;
    title?: string;
    type: 'changeTab';
};

const originalIcon = ref<string>();
const originalTitle = ref<string>();

const getTabInfo = async () => {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });

    if (!currentTab) {
        return;
    }

    originalTitle.value = currentTab.title;
    originalIcon.value = currentTab.favIconUrl;
};

getTabInfo();

const changeTab = async () => {
    const [currentTab] = await browser.tabs.query({ active: true, currentWindow: true });
    const tabId = currentTab?.id;

    if (tabId === undefined) {
        return;
    }

    await browser.scripting.executeScript({
        target: {
            tabId,
        },
        func: executeChangeTab,
    });
    await browser.tabs.sendMessage(tabId, {
        type: 'changeTab',
        title: originalTitle.value,
        icon: originalIcon.value,
    });
};

const executeChangeTab = () => {
    console.log('change tab');

    const injected = globalThis.injected;
    if (injected) {
        return;
    }
    globalThis.injected = true;

    chrome.runtime.onMessage.addListener((message: unknown) => {
        const changeMessage = message as ChangeTabMessage;

        if (changeMessage.type !== 'changeTab') {
            return;
        }

        if (changeMessage.title) {
            document.title = changeMessage.title;
        }

        if (!changeMessage.icon) {
            return;
        }

        const link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/x-icon';
        link.href = changeMessage.icon;

        document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.remove();
        document.head.appendChild(link);
    });
};
</script>

<style lang="scss">
:root {
    color-scheme: light;
    --ft-primary: #e11d48;
    --ft-primary-dark: #be123c;
    --ft-primary-soft: #ffe4e6;
    --ft-background: #f8fafc;
    --ft-surface: #ffffff;
    --ft-border: #e2e8f0;
    --ft-muted: #64748b;
    --ft-text: #111827;
}

html,
body {
    margin: 0;
    background: var(--ft-background);
}

#app {
    width: 300px;
    background: var(--ft-background);
    color: var(--ft-text);
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
    background: var(--ft-background);
}

.popup-header {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 7px 12px;
    background: var(--ft-primary);
    color: #ffffff;
}

.brand-icon-wrap {
    display: inline-flex;
    width: 24px;
    height: 24px;
    align-items: center;
    justify-content: center;
    flex: 0 0 24px;
    border-radius: 6px;
    background: rgb(255 255 255 / 16%);
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

.icon-preview {
    display: inline-flex;
    width: 22px;
    height: 22px;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    margin-left: -2px;
    margin-right: 0;
    border: 1px solid var(--ft-border);
    border-radius: 5px;
    background: #f1f5f9;
}

.icon-preview-empty {
    color: var(--ft-muted);
    font-size: 10px;
    font-weight: 800;
    line-height: 1;
}

.icon-preview .v-img {
    width: 100%;
    height: 100%;
}

.popup-shell .v-field {
    min-height: 34px;
    border-radius: 6px;
    background: var(--ft-surface);
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
    color: var(--ft-border);
    opacity: 1;
}

.popup-shell .v-field--focused {
    background: #ffffff;
    box-shadow: 0 0 0 2px var(--ft-primary-soft);
}

.popup-shell .v-field--focused .v-field__outline {
    color: var(--ft-primary);
}

.popup-shell .v-label,
.popup-shell .v-field-label {
    color: var(--ft-muted);
    font-size: 12px;
}

.popup-shell .v-field--focused .v-label,
.popup-shell .v-field--focused .v-field-label {
    color: var(--ft-primary);
}

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
    background: var(--ft-primary-dark);
}
</style>
