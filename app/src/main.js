import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

import './css/main.scss';

Vue.config.productionTip = false;

import Metamask from './library/MetaMask';
const metamask = new Metamask();
window.metamask = metamask;
Vue.prototype.$metamask = metamask;

metamask.on('EVENT_ACCOUNT_CONNECTED',    () => { window.location.reload() });
metamask.on('EVENT_ACCOUNT_SWITCHED',     () => { window.location.reload() });
metamask.on('EVENT_ACCOUNT_DISCONNECTED', () => { window.location.reload() });
metamask.on('EVENT_CHAIN_SWITCHED',       () => { window.location.reload() });

new Vue({
  router,
  store,
  async beforeCreate() {
    await metamask.init();
    this.$mount('#app');
  },
  render: h => h(App)
});
