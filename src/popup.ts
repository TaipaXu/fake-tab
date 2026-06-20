import App from './popup.vue';
import { createApp } from 'vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import colors from 'vuetify/lib/util/colors.mjs';

const vuetify = createVuetify({
    theme: {
        defaultTheme: 'fakeTab',
        themes: {
            fakeTab: {
                dark: false,
                colors: {
                    background: '#fff5f5',
                    surface: '#ffffff',
                    primary: colors.red.base,
                    secondary: colors.red.lighten4,
                    accent: colors.red.darken3,
                    error: colors.red.darken4,
                    info: '#2563eb',
                    success: colors.red.base,
                    warning: '#d97706',
                    'on-primary': '#ffffff',
                    'on-surface': '#2b1111',
                },
            },
        },
    },
});

const app = createApp(App);
app.use(vuetify);
app.mount('#app');
