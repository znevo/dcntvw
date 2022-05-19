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

describe("DCNTVaultFactory contract", () => {
  let token: Contract,
      nft: Contract,
      factory: Contract,
      implementation: Contract,
      clone: Contract,
      currentDate: Date,
      owner: SignerWithAddress;

  describe("basic tests", () => {
    beforeEach(async () => {
      [owner] = await ethers.getSigners();
      currentDate = new Date();
      nft = await deployNFT();
      token = await deployERC20(100);

      implementation = await deployDCNTVWImplementation();
      factory = await deployDCNTVWFactory(implementation.address);
      clone = await deployDCNTVWClone(
        factory,
        token.address,
        nft.address,
        Math.floor(currentDate.getTime() / 1000)
      );
    });

    describe("initial deployment", async () => {
      it("should store the implementation address on the vault factory", async () => {
        expect(ethers.utils.getAddress(await factory.vaultImplementation())).to.equal(implementation.address);
      });
    });

    describe("dcnt vault wrapper clones", async () => {
      it("should have the owner set as the EOA deploying the vault", async () => {
        expect(ethers.utils.getAddress(await clone.owner())).to.equal(owner.address);
      });

      it("should have the same erc20 address as its backing token", async () => {
        expect(ethers.utils.getAddress(await clone.vaultDistributionToken())).to.equal(token.address);
      });

      it("should have the same erc721 address as its backing nft", async () => {
        expect(ethers.utils.getAddress(await clone.nftVaultKey())).to.equal(nft.address);
      });

      it("should have the specified unlock date", async () => {
        expect(await clone.unlockDate()).to.equal(Math.floor(currentDate.getTime() / 1000));
      });
    });
  });
});

describe("DCNTVaultWrapper contract", () => {
  let token: Contract, nft: Contract, vault: Contract, unlockedVault: Contract;
  let tree: MerkleTree, leaves: Array<string>;
  let addr1: SignerWithAddress,
      addr2: SignerWithAddress,
      addr3: SignerWithAddress,
      addr4: SignerWithAddress,
      addr5: SignerWithAddress;

  describe("basic tests", () => {

    beforeEach(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      let currentDate = new Date();
      nft = await deployNFT();
      token = await deployERC20(100);
      // token.setBalance(owner.address, 100);
      vault = await deployDCNTVaultWrapper(
        token.address,
        nft.address,
        Math.floor(currentDate.getTime() / 1000)
      );
    })
    
    describe("initial deployment", async () => {
      it("should have the same erc20 address as its backing token", async () => {
        expect(ethers.utils.getAddress(await vault.vaultDistributionToken())).to.equal(token.address);
      })
      
      it("should have the same erc721 address as its backing nft", async () => {
        expect(ethers.utils.getAddress(await vault.nftVaultKey())).to.equal(nft.address);
      })
    })

    describe("vault functionality", async () => {
      it("should have a vault balance of zero", async () => {
        expect(await vault.vaultBalance()).to.equal(0);
      })
      
      describe("and 50 tokens are added to the vault", async () => {

        it("should have a vault balance of 50", async () => {
          await token.connect(addr1).transfer(vault.address, 50);
          expect(await vault.vaultBalance()).to.equal(50);
        })
      })
      
      describe("and 50 more tokens are added to the vault", async () => {

        it("should have a vault balance of 100", async () => {
          await token.connect(addr1).transfer(vault.address, 100);
          expect(await vault.vaultBalance()).to.equal(100);
        })
      })
    })
  })
  
  describe("claiming core functionality", async () => {
    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      let tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      nft = await deployNFT();
      token = await deployERC20(100);

      // mint 1 nft for 1 address and 2 for 2 more
      await nft.connect(addr1).mintNft(1);
      await nft.connect(addr2).mintNft(2);
      await nft.connect(addr3).mintNft(2);

      vault = await deployDCNTVaultWrapper(
        token.address,
        nft.address,
        Math.floor(tomorrow.getTime() / 1000)
      );

      // send 100 tokens to the vault
      await token.connect(addr1).transfer(vault.address, 100);

      const snapshot = [
        [addr1.address, 1],
        [addr2.address, 2],
        [addr3.address, 2],
      ];

      leaves = snapshot.map((address: any[]) => {
        return ethers.utils.solidityKeccak256(["address", "uint256"], [address[0], address[1]]);
      });

      tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const root = tree.getHexRoot();
    })

    describe("and the vault is locked", async () => {
      
      describe("and a user with an nft tries to pull out money", async () => {
        it("should produce a warning preventing this", async () => {
          await expect(
            vault.claim(addr1.address, 1, tree.getHexProof(leaves[0]))
          ).to.be.revertedWith(
            'vault is still locked'
          );
        })
      })

      describe("and a user without an nft tries to pull out money", async () => {
        it("should produce a warning preventing this", async () => {
          await expect(
            vault.claim(addr4.address, 1, tree.getHexProof(leaves[0]))
          ).to.be.revertedWith(
            'vault is still locked'
          );
        })
      })
    })

    before(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      nft = await deployNFT();
      token = await deployERC20(100);


      // set nft portions
      await nft.connect(addr1).mintNft(1);
      await nft.connect(addr2).mintNft(2);
      await nft.connect(addr3).mintNft(2);

      unlockedVault = await deployDCNTVaultWrapper(
        token.address,
        nft.address,
        Math.floor(yesterday.getTime() / 1000)
      )

      // send 100 tokens to the vault
      await token.connect(addr1).transfer(unlockedVault.address, 100);

      const snapshot = [
        [addr1.address, 1],
        [addr2.address, 2],
        [addr3.address, 2],
      ];

      leaves = snapshot.map((address: any[]) => {
        return ethers.utils.solidityKeccak256(["address", "uint256"], [address[0], address[1]]);
      });

      tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const root = tree.getHexRoot();
      const rootTx = await unlockedVault.unlockVault(root);
      await rootTx.wait();
    })

    describe("and the vault is unlocked", async () => {

      describe("and a user without any nft keys tries to redeem tokens", async () => {
        it("he would recieve zero tokens", async () => {
          await expect(
            unlockedVault.claim(addr4.address, 1, tree.getHexProof(leaves[0]))
          ).to.be.revertedWith(
            'merkle proof is invalid'
          );
        })
      })

      describe("and a user with one nft tries to redeem his tokens (1/5 nfts * 100 tokens)", async () => {
        it("should transfer 20 tokens to the user's account", async () => {
          await unlockedVault.claim(addr1.address, 1, tree.getHexProof(leaves[0]));
          expect(await token.balanceOf(addr1.address)).to.equal(20);
        })
      })

      describe("and a user who has already redeemed his tokens tries to redeem again", async () => {
        it("should prevent the user from doing this", async () => {
          await expect(
            unlockedVault.claim(addr1.address, 1, tree.getHexProof(leaves[0]))
          ).to.be.revertedWith(
            'token already claimed'
          );
        })
      })

      describe("and a user with two nfts tries to redeem tokens (2/5 * 100)", async () => {
        it("should should transfer 40 tokens to the user's account", async () => {
          unlockedVault.claim(addr2.address, 2, tree.getHexProof(leaves[1]));
          // balance will equal 40
          expect(await token.balanceOf(addr2.address)).to.equal(40);
        })
      })
    })
  })

  describe("claiming division tests", async () => {
    before(async () => {
      [addr1, addr2, addr3, addr4, addr5] = await ethers.getSigners();
      nft = await deployNFT();
      token = await deployERC20(73);

      let yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await nft.connect(addr1).mintNft(3);
      await nft.connect(addr2).mintNft(1);
      await nft.connect(addr3).mintNft(1);
      await nft.connect(addr4).mintNft(1);
      await nft.connect(addr5).mintNft(5);
      // token.setBalance(owner.address, 100);
      unlockedVault = await deployDCNTVaultWrapper(
        token.address,
        nft.address,
        Math.floor(yesterday.getTime() / 1000)
      )

      await token.connect(addr1).transfer(unlockedVault.address, 73);

      const snapshot = [
        [addr1.address, 3],
        [addr2.address, 1],
        [addr3.address, 1],
        [addr4.address, 1],
        [addr5.address, 5],
      ];

      leaves = snapshot.map((address: any[]) => {
        return ethers.utils.solidityKeccak256(["address", "uint256"], [address[0], address[1]]);
      });

      tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const root = tree.getHexRoot();
      const rootTx = await unlockedVault.unlockVault(root);
      await rootTx.wait();
    })

    describe("and a user with three of eleven nfts tries to redeem tokens (3 * 73)/11", async () => {
      it("should should transfer 19 tokens to the user's account", async () => {
        await unlockedVault.claim(addr1.address, 3, tree.getHexProof(leaves[0]))
        expect(await token.balanceOf(addr1.address)).to.equal(19);
      })
    })

    describe("and he then receives another one and tries to redeem it", async () => {
      it("should prevent user from doing this", async () => {
        await nft.connect(addr2)["safeTransferFrom(address,address,uint256)"](addr2.address, addr1.address, 3);
        await expect(
          unlockedVault.claim(addr1.address, 4, tree.getHexProof(leaves[0]))
        ).to.be.revertedWith(
          'merkle proof is invalid'
        );
        expect(await token.balanceOf(addr1.address)).to.equal(19);
      })
    })

    describe("and he then receives another one thats already been claimed and tries to redeem it", async () => {
      it("should return an error", async () => {
        await unlockedVault.claim(addr3.address, 1, tree.getHexProof(leaves[2]));
        await nft.connect(addr3)["safeTransferFrom(address,address,uint256)"](addr3.address, addr1.address, 4);
        await expect(
          unlockedVault.claim(addr1.address, 5, tree.getHexProof(leaves[0]))
        ).to.be.revertedWith(
          'merkle proof is invalid'
        );
      })
    })

    describe("and a user tries to claim an already claimed token", async () => {
      it("should revert with token already claimed", async () => {
        await expect(
          unlockedVault.claim(addr1.address, 3, tree.getHexProof(leaves[0]))
        ).to.be.revertedWith(
          "token already claimed"
        );
      })
    })

    describe("and a user tries to claim one token using claim", async () => {
      it("should show user w balance of 1/11 * 73 tokens (~6)", async () => {
        await unlockedVault.claim(addr4.address, 1, tree.getHexProof(leaves[3]))
        expect(await token.balanceOf(addr4.address)).to.equal(6);
      })
    })
  })

  describe("merkle tree claiming functionality", () => {
    let token: Contract, nft: Contract, vault: Contract, unlockedVault: Contract;
    let addr1: SignerWithAddress,
        addr2: SignerWithAddress,
        addr3: SignerWithAddress,
        addr4: SignerWithAddress;
    let tree: MerkleTree, leaves: Array<string>;

    beforeEach(async () => {
      [addr1, addr2, addr3, addr4] = await ethers.getSigners();
      let currentDate = new Date();
      nft = await deployNFT();
      token = await deployERC20(100);

      // set nft portions
      await nft.connect(addr1).mintNft(1);
      await nft.connect(addr2).mintNft(2);
      await nft.connect(addr3).mintNft(3);
      await nft.connect(addr4).mintNft(4);

      vault = await deployDCNTVaultWrapper(
        token.address,
        nft.address,
        Math.floor(currentDate.getTime() / 1000)
      );

      // send 100 tokens to the vault
      await token.connect(addr1).transfer(vault.address, 100);

      const snapshot = [
        [addr1.address, 1],
        [addr2.address, 2],
        [addr3.address, 3],
        [addr4.address, 4],
      ];

      leaves = snapshot.map((address: any[]) => {
        return ethers.utils.solidityKeccak256(["address", "uint256"], [address[0], address[1]]);
      });

      tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
      const root = tree.getHexRoot();
      const rootTx = await vault.unlockVault(root);
      await rootTx.wait();
    });

    describe("and a user with 1 nft tries to redeem his tokens (1/10 nfts * 100 tokens)", async () => {
      it("should transfer 20 tokens to the user's account", async () => {
        await vault.claim(addr1.address, 1, tree.getHexProof(leaves[0]));
        expect(await token.balanceOf(addr1.address)).to.equal(10);
      });
    });

    describe("and a user with 1 nft tries to redeem 2 nfts", async () => {
      it("should prevent the user from doing this", async () => {
        await expect(vault.claim(addr1.address, 2, tree.getHexProof(leaves[0]))).to.be.revertedWith(
          'merkle proof is invalid'
        );
      });
    });

    describe("and a user with 2 nft tries to redeem his tokens (2/10 nfts * 100 tokens)", async () => {
      it("should transfer 20 tokens to the user's account", async () => {
        await vault.claim(addr2.address, 2, tree.getHexProof(leaves[1]));
        expect(await token.balanceOf(addr2.address)).to.equal(20);
      });
    });

    describe("and a user with 3 nft tries to redeem his tokens (3/10 nfts * 100 tokens)", async () => {
      it("should transfer 30 tokens to the user's account", async () => {
        await vault.claim(addr3.address, 3, tree.getHexProof(leaves[2]));
        expect(await token.balanceOf(addr3.address)).to.equal(30);
      });
    });

    describe("and a user with 4 nft tries to redeem his tokens (4/10 nfts * 100 tokens)", async () => {
      it("should transfer 40 tokens to the user's account", async () => {
        await vault.claim(addr4.address, 4, tree.getHexProof(leaves[3]));
        expect(await token.balanceOf(addr4.address)).to.equal(40);
      });
    });
  });
})
