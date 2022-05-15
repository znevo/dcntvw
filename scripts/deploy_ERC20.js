const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const ERC20 = await ethers.getContractFactory("TestERC20");
  const erc20 = await ERC20.deploy(
    "token",
    "TKN",
    100
  );
  await erc20.deployed();

  console.log("ERC20 deployed to:", erc20.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
