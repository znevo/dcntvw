const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const DCNTVaultWrapper = await ethers.getContractFactory("DCNTVaultWrapper");
  const dcntVaultWrapper = await DCNTVaultWrapper.deploy();
  await dcntVaultWrapper.deployed();

  console.log("DCNT VW deployed to:", dcntVaultWrapper.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
