import App from './popup.vue';
import { createApp } from 'vue';

import { createExtensionVuetify } from './vuetify';

const vuetify = createExtensionVuetify();

const app = createApp(App);
app.use(vuetify);
app.mount('#app');
