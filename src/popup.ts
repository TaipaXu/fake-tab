import App from './popup.vue';
import { createApp } from 'vue';
import 'vuetify/styles';
import { createVuetify } from 'vuetify';

const vuetify = createVuetify({
    theme: {
        defaultTheme: 'fakeTab',
        themes: {
            fakeTab: {
                dark: false,
                colors: {
                    background: '#f8fafc',
                    surface: '#ffffff',
                    primary: '#e11d48',
                    secondary: '#ffe4e6',
                    accent: '#0f766e',
                    error: '#be123c',
                    info: '#2563eb',
                    success: '#0f766e',
                    warning: '#d97706',
                    'on-primary': '#ffffff',
                    'on-surface': '#111827',
                },
            },
        },
    },
});

const app = createApp(App);
app.use(vuetify);
app.mount('#app');
