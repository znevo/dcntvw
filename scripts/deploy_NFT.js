const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const ERC721 = await ethers.getContractFactory("TestERC721");
  const erc721 = await ERC721.deploy("nft", "NFT");
  await erc721.deployed();
  console.log("ERC721 deployed to:", erc721.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
