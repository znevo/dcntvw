import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Explore from '../views/Explore.vue';
import Vault from '../views/Vault.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/explore',
    name: 'Explore',
    component: Explore
  },
  {
    path: '/explore/:vault',
    name: 'Vault',
    component: Vault
  },
];

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
});

export default router;
