import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { vTip } from './directives/tip';
import './styles.css';

createApp(App).directive('tip', vTip).use(createPinia()).mount('#app');
