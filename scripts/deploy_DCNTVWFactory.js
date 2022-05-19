const hre = require("hardhat");
const { ethers } = require("hardhat");

const vaultImplementationAddress = '';

async function main() {
  const DCNTVWFactory = await ethers.getContractFactory("DCNTVWFactory");
  const dcntVWFactory = await DCNTVWFactory.deploy(vaultImplementationAddress);
  await dcntVWFactory.deployed();

  console.log("DCNTVWFactory deployed to:", dcntVWFactory.address);
  console.log("DCNTVWFactory vault implementation address:", await dcntVWFactory.vaultImplementation());
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
