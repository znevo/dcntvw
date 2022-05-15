<template>
  <div class="home">

    <section class="section">
      <div class="container constrained is-max-desktop">

        <div class="box pt-5 pb-5" v-if="stats">
          <h1 class="title is-size-4 has-text-dark">Vault Viewer</h1>
          <h1 class="subtitle is-size-6 has-text-dark">View and interact with your vault below!</h1>

          <table width="100%" class="table">
            <tr>
              <td class="is-size-6">Vault Address</td>
              <td align="right" class="is-size-7 has-text-weight-medium" style="line-height: 28px;">
                <a :href="'https://testnet.snowtrace.io/address/' + stats.vaultAddress" target="_blank">
                  {{ stats.vaultAddress }}
                </a>
              </td>
            </tr>
            <tr>
              <td class="is-size-6">Distribution Token</td>
              <td align="right" class="is-size-7 has-text-weight-medium" style="line-height: 28px;">
                <a :href="'https://testnet.snowtrace.io/address/' + stats.vaultDistributionToken" target="_blank">
                  {{ stats.vaultDistributionToken }}
                </a>
              </td>
            </tr>
            <tr>
              <td class="is-size-6">NFT Vault Key</td>
              <td align="right" class="is-size-7 has-text-weight-medium" style="line-height: 28px;">
                <a :href="'https://testnet.snowtrace.io/address/' + stats.NftWrapperToken" target="_blank">
                  {{ stats.NftWrapperToken }}
                </a>
              </td>
            </tr>
            <tr>
              <td class="is-size-6">Unlock Date</td>
              <td align="right" class="is-size-7" style="line-height: 28px;">{{ stats.unlockDate }}</td>
            </tr>
          </table>

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
      stats: null,
    };
  },
  async mounted() {
    const provider = new ethers.providers.Web3Provider(this.$metamask.provider);
    const signer = await provider.getSigner();
    const dcntvw = new ethers.Contract(this.$route.params.vault, DCNTVW.abi, signer);

    this.stats = {
      vaultAddress: dcntvw.address,
      vaultDistributionToken: await dcntvw.vaultDistributionToken(),
      NftWrapperToken: await dcntvw.nftVaultKey(),
      unlockDate: (new Date(parseInt(await dcntvw.unlockDate()) * 1000)).toLocaleString(),
    }
  },
  computed: {

  },
  methods: {

  }
}
</script>
