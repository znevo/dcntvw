<template>
  <div class="home">

    <section class="section onboarding install-metamask" v-if="! $metamask.installed">
      <div class="container is-max-desktop has-text-centered">
        <a href="https://metamask.io/" target="_blank" class="button is-large is-success">Install MetaMask</a>
      </div>
    </section>

    <section class="section onboarding connect-wallet" v-if="$metamask.installed && ! $metamask.user">
      <div class="container is-max-desktop has-text-centered">
        <button class="button is-large is-info" @click="connect">Connect Wallet</button>
      </div>
    </section>

    <section class="section onboarding connect-network" v-if="$metamask.user && ! ($metamask.ready('fuji') || $metamask.ready('hardhat'))">
      <div class="container is-max-desktop has-text-centered">
        <article class="message is-warning">
          <div class="message-body">
            You must connect to the Fuji test network to continue.
          </div>
        </article>
        <button class="button is-large is-info" @click="chain">Connect To Fuji</button>
      </div>
    </section>

    <section class="section" v-if="$metamask.user && ($metamask.ready('fuji') || $metamask.ready('hardhat'))">
      <div class="container is-max-desktop">

      </div>
    </section>

  </div>
</template>

<script>
export default {
  name: 'Home',
  methods: {
    connect() {
      this.$metamask.connect();
    },

    chain() {
      this.$metamask.chain('fuji');
    },
  }
}
</script>
