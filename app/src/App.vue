<template>
  <div id="app">

    <section class="has-text-centered pt-6">
      <div class="container is-max-desktop p-4">
        <p class="title">
          DCNT VW
        </p>
        <p class="subtitle">
          Decentralized Creator Nonfungible Token Vault Wrappers
        </p>
      </div>
    </section>

    <div class="tabs is-centered is-toggle is-toggle-rounded is-medium m-0 mt-6"
     v-if="$metamask.user && ($metamask.ready('fuji') || $metamask.ready('hardhat'))"
    >
      <ul>
        <li :class="$route.name === 'Home' ? 'is-active' : ''">
          <router-link to="/">
            <span>Launch</span>
          </router-link>
        </li>
        <li :class="($route.name === 'Explore' || $route.name === 'Vault') ? 'is-active' : ''">
          <router-link to="/explore">
            <span>Explore</span>
          </router-link>
        </li>
      </ul>
    </div>

    <router-view />

  </div>
</template>
