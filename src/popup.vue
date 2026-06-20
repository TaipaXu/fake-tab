<template>
    <v-container class="popup-shell">
        <v-row>
            <v-col cols="12">
                <v-text-field
                v-model="originalIcon"
                label="Icon"
                density="compact"
                variant="outlined"
                color="primary"
                hide-details>
                    <template #prepend-inner>
                        <v-img
                        :src="originalIcon"
                        width="25"
                        height="25" />
                    </template>
                </v-text-field>
            </v-col>

            <v-col cols="12">
                <v-text-field
                v-model="originalTitle"
                label="Title"
                variant="outlined"
                color="primary"
                density="compact"
                hide-details></v-text-field>
            </v-col>
        </v-row>
        <v-row cols="12">
            <v-btn
            type="submit"
            block
            size="small"
            variant="elevated"
            color="primary"
            class="submit-button mt-2"
            @click="changeTab">Submit</v-btn>
        </v-row>
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
    --ft-primary: #f44336;
    --ft-primary-soft: #ffcdd2;
    --ft-background: #ffffff;
    --ft-surface: #ffffff;
    --ft-text: #2b1111;
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
}

.popup-shell {
    padding: 16px;
}

.popup-shell .v-row {
    margin: -6px;
}

.popup-shell .v-col {
    padding: 6px;
}

.popup-shell .v-field {
    border-radius: 8px;
    background: var(--ft-surface);
    box-shadow: 0 1px 2px rgb(244 67 54 / 8%);
}

.popup-shell .v-field--focused {
    box-shadow: 0 0 0 3px var(--ft-primary-soft);
}

.submit-button {
    min-height: 34px;
    border-radius: 8px;
    box-shadow: 0 6px 14px rgb(244 67 54 / 20%);
}
</style>
