<template>
    <v-container>
        <v-row>
            <v-col cols="12">
                <v-text-field
                v-model="originalIcon"
                label="Icon"
                density="compact"
                variant="solo"
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
                variant="solo"
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
            color="success"
            class="mt-2"
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
#app {
    width: 300px;
}
</style>
