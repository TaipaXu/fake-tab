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
import browser from 'webextension-polyfill';

const originalIcon: Ref<string | undefined> = ref();
const originalTitle: Ref<string | undefined> = ref();

const getTabInfo = async () => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    originalTitle.value = currentTab.title;
    originalIcon.value = currentTab.favIconUrl;
};

getTabInfo();

const changeTab = async () => {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];
    const tabId: number | undefined = currentTab?.id;
    if (tabId) {
        browser.scripting.executeScript({
            target: {
                tabId,
            },
            func: executeChangeTab
        });
        browser.tabs.sendMessage(
            tabId,
            {
                type: 'changeTab',
                title: originalTitle.value,
                icon: originalIcon.value
            }
        );
    }
};

const executeChangeTab = () => {
    console.log('change tab');

    const injected = globalThis.injected;
    if (injected) {
        return;
    }
    globalThis.injected = true;

    chrome.runtime.onMessage.addListener((message: string) => {
        if (message.type === 'changeTab') {
            document.title = message.title;

            var link = document.createElement('link');
            link.rel = 'icon';
            link.type = 'image/x-icon';
            link.href = message.icon;

            var head = document.querySelector('head');

            var oldLink = document.querySelector('link[rel="icon"]');
            if (oldLink) {
                head.removeChild(oldLink);
            }

            head.appendChild(link);
        }
    });
};
</script>

<style lang="scss">
#app {
    width: 300px;
}
</style>
