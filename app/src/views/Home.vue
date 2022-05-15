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
      <div class="container constrained is-max-desktop">

        <div class="box pt-5 pb-5">
          <h1 class="title is-size-4 has-text-dark">Launch Your Vault</h1>
          <h1 class="subtitle is-size-6 has-text-dark">Customize your DCNT VW and submit to deploy!</h1>

          <div class="field mb-5 pt-2">
            <label class="label">Vault Distribution Token Address</label>
            <p class="control is-expanded">
              <input class="input is-medium is-rounded no-focus" type="text" v-model="form.vaultDistributionToken" placeholder="0x...">
            </p>
          </div>

          <div class="field mb-5">
            <label class="label">Nft Wrapper Token Address</label>
            <p class="control is-expanded">
              <input class="input is-medium is-rounded no-focus" type="text" v-model="form.NftWrapperToken" placeholder="0x...">
            </p>
          </div>

          <div class="field mb-5">
            <label class="label">Unlock Date</label>
            <p class="control is-expanded">
              <input class="input is-medium is-rounded no-focus" type="date" v-model="form.unlockDate">
            </p>
          </div>

          <div class="has-text-centered">
            <p class="control pt-4">
              <button class="button is-black is-outlined is-medium is-rounded" @click="deploy">
                deploy now
              </button>
            </p>
          </div>
        </div>

      </div>
    </section>

  </div>
</template>

<script>
import { ethers } from 'ethers';
import DCNTVW from '../../artifacts/contracts/DCNTVaultWrapper.sol/DCNTVaultWrapper';

export default {
  name: 'Home',
  data() {
    return {
      form: {
        vaultDistributionToken: null,
        NftWrapperToken: null,
        unlockDate: null,
      },
    };
  },
  async mounted() {

  },
  computed: {

  },
  methods: {
    connect() {
      this.$metamask.connect();
    },

    chain() {
      this.$metamask.chain('fuji');
    },
    async deploy() {
      const provider = new ethers.providers.Web3Provider(this.$metamask.provider);
      const signer = await provider.getSigner();
      const dcntvwFactory = new ethers.ContractFactory(DCNTVW.abi, DCNTVW.bytecode, signer);

      const dcntvw = await dcntvwFactory.deploy(
        this.form.vaultDistributionToken,
        this.form.NftWrapperToken,
        Date.parse(this.form.unlockDate) / 1000
      );
      await dcntvw.deployed();

      console.log("DCNT VW deployed to:", dcntvw.address);
    }
  }
}
</script>
