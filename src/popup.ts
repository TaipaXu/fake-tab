import App from './popup.vue';
import 'vuetify/styles'
import { createVuetify } from 'vuetify'

const vuetify = createVuetify()

const app = createApp(App);
app.use(vuetify);
app.mount('#app');
