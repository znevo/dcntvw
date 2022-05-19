import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumber, Contract } from "ethers";
import { ethers, waffle } from "hardhat";
import { before, beforeEach } from "mocha";
import { MerkleTree } from "merkletreejs";
const keccak256 = require("keccak256");

const deployERC20 = async (amountToMint: number) => {
  const TestERC20 = await ethers.getContractFactory("TestERC20");
  const erc20Token = await TestERC20.deploy(
    "token",
    "TKN",
    amountToMint
  );
  return await erc20Token.deployed();
}

const deployNFT = async () => {
  const TestERC721 = await ethers.getContractFactory("TestERC721");
  const erc721Token = await TestERC721.deploy(
    "nft",
    "NFT",
  );
  return await erc721Token.deployed();
}

const deployDCNTVaultWrapper = async (
  _vaultDistributionTokenAddress: string,
  _NftWrapperTokenAddress: string,
  _unlockDate: number
) => {
  const dcntVWImplementation = await deployDCNTVWImplementation();
  const dcntVWFactory = await deployDCNTVWFactory(dcntVWImplementation.address);
  const dcntVaultWrapper = await deployDCNTVWClone(
    dcntVWFactory,
    _vaultDistributionTokenAddress,
    _NftWrapperTokenAddress,
    _unlockDate
  );
  return dcntVaultWrapper;
}

const deployDCNTVWImplementation = async () => {
  const DCNTVaultWrapper = await ethers.getContractFactory("DCNTVaultWrapper");
  const dcntVWImplementation = await DCNTVaultWrapper.deploy();
  return await dcntVWImplementation.deployed();
}

const deployDCNTVWFactory = async (
  _vaultImplementationAddress: string,
) => {
  const DCNTVWFactory = await ethers.getContractFactory("DCNTVWFactory");
  const dcntVWFactory = await DCNTVWFactory.deploy(
    _vaultImplementationAddress,
  );
  return await dcntVWFactory.deployed();
}

const deployDCNTVWClone = async (
  dcntVWFactory: Contract,
  _vaultDistributionTokenAddress: string,
  _NftWrapperTokenAddress: string,
  _unlockDate: number
) => {
  const deployTx = await dcntVWFactory.deployVault(
    _vaultDistributionTokenAddress,
    _NftWrapperTokenAddress,
    _unlockDate
  );

  const receipt = await deployTx.wait();
  const newVaultAddress = receipt.events.find((x: any) => x.event === 'NewVault').args[0];
  return ethers.getContractAt("DCNTVaultWrapper", newVaultAddress);
}

describe("DCNTVaultWrapper claiming gas comparisons", () => {
  let token: Contract, nft: Contract, vault: Contract, unlockedVault: Contract;
  let addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress;
  let snapshot: Array<any>, leaves: Array<any>;
  let root: String;
  let tree: MerkleTree;

  describe("using claimAll", async () => {
    beforeEach(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      nft = await deployNFT();
      token = await deployERC20(100);

      // set nft portions
      await nft.connect(addr1).mintNft(10);
      await nft.connect(addr2).mintNft(20);
      await nft.connect(addr3).mintNft(30);
      await nft.connect(addr4).mintNft(40);

      unlockedVault = await deployDCNTVaultWrapper(
        token.address,
        nft.address,
        Math.floor(yesterday.getTime() / 1000)
      )

      // send 100 tokens to the vault
      await token.connect(addr1).transfer(unlockedVault.address, 100);
    })

    describe("and a user with 40 nfts tries to redeem tokens (40/100 * 100)", async () => {
      it("should should transfer 40 tokens to the user's account", async () => {
        await unlockedVault.claimAll(addr4.address);
        expect(await token.balanceOf(addr4.address)).to.equal(40);
      })
    })
  })

  describe("using claimMultiple", async () => {
    beforeEach(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      nft = await deployNFT();
      token = await deployERC20(100);


      // set nft portions
      await nft.connect(addr1).mintNft(10);
      await nft.connect(addr2).mintNft(20);
      await nft.connect(addr3).mintNft(30);
      await nft.connect(addr4).mintNft(40);

      unlockedVault = await deployDCNTVaultWrapper(
        token.address,
        nft.address,
        Math.floor(yesterday.getTime() / 1000)
      )

      // send 100 tokens to the vault
      await token.connect(addr1).transfer(unlockedVault.address, 100);
    })

    describe("and a user with 40 nfts tries to redeem tokens (40/100 * 100)", async () => {
      it("should should transfer 40 tokens to the user's account", async () => {
        // get array of token ids from 60-99
        const tokenRange = Array.from({length: 100}, (v, i) => i).slice(-40);
        await unlockedVault.claimMultiple(addr4.address,tokenRange);
        expect(await token.balanceOf(addr4.address)).to.equal(40);
      })
    })
  })

  describe("using claimMerkle", async () => {
    beforeEach(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      nft = await deployNFT();
      token = await deployERC20(100);

      // set nft portions
      await nft.connect(addr1).mintNft(10);
      await nft.connect(addr2).mintNft(20);
      await nft.connect(addr3).mintNft(30);
      await nft.connect(addr4).mintNft(40);

      vault = await deployDCNTVaultWrapper(
        token.address,
        nft.address,
        Math.floor(yesterday.getTime() / 1000)
      )

      // send 100 tokens to the vault
      await token.connect(addr1).transfer(vault.address, 100);

      const snapshot = [
        [addr1.address, 10],
        [addr2.address, 20],
        [addr3.address, 30],
        [addr4.address, 40],
      ];

      leaves = snapshot.map((account: any[]) => {
        return ethers.utils.solidityKeccak256(["address", "uint256"], [account[0], account[1]]);
      });

      tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      root = tree.getHexRoot();
      const rootTx = await vault.unlockVault(root);
      await rootTx.wait();
    })

    describe("and a user with forty nfts tries to redeem tokens (40/100 * 100)", async () => {
      it("should should transfer 40 tokens to the user's account", async () => {
        const tx = await vault.claimMerkle(addr4.address, 40, tree.getHexProof(leaves[3]));
        expect(await token.balanceOf(addr4.address)).to.equal(40);
      })
    })
  })
})
