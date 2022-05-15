<template>
  <div class="home">

    <section class="section">
      <div class="container constrained is-max-desktop">

        <div class="box pt-5 pb-5">
          <h1 class="title is-size-4 has-text-dark">Explore A Vault</h1>
          <h1 class="subtitle is-size-6 has-text-dark">Enter a vault address and start exploring!</h1>

          <div class="field mb-5 pt-2">
            <label class="label">DCNT Vault Wrapper Address</label>
            <p class="control is-expanded">
              <input class="input is-medium is-rounded no-focus" type="text" v-model="form.vaultAddress" placeholder="0x...">
            </p>
          </div>

          <div class="has-text-centered">
            <p class="control pt-4">
              <button class="button is-black is-outlined is-medium is-rounded" @click="explore">
                explore now
              </button>
            </p>
          </div>
        </div>

      </div>
    </section>

  </div>
</template>

<script>
export default {
  name: 'Home',
  data() {
    return {
      form: {
        vaultAddress: null,
      },
    };
  },
  async mounted() {

  },
  computed: {

  },
  methods: {
    async explore() {
      this.$router.push(`/explore/${this.form.vaultAddress}`);
    },
  }
}
</script>
