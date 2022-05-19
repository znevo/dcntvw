const hre = require("hardhat");
const { ethers } = require("hardhat");

const vaultFactoryAddress = '';
const vaultDistributionTokenAddress = '';
const NftWrapperTokenAddress = '';

let tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const unlockDate = Math.floor(tomorrow.getTime() / 1000);

const deployDCNTVWClone = async (
  dcntVWFactory,
  _vaultDistributionTokenAddress,
  _NftWrapperTokenAddress,
  _unlockDate
) => {
  const deployTx = await dcntVWFactory.deployVault(
    _vaultDistributionTokenAddress,
    _NftWrapperTokenAddress,
    _unlockDate
  );

  const receipt = await deployTx.wait();
  const newVaultAddress = receipt.events.find(x => x.event === 'NewVault').args[0];
  return await ethers.getContractAt("DCNTVaultWrapper", newVaultAddress);
}

async function main() {
  const dcntVWFactory = await ethers.getContractAt("DCNTVWFactory", vaultFactoryAddress);
  const dcntVWClone = await deployDCNTVWClone(
    dcntVWFactory,
    vaultDistributionTokenAddress,
    NftWrapperTokenAddress,
    unlockDate
  );

  console.log("DCNT VW Clone deployed to:", dcntVWClone.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
