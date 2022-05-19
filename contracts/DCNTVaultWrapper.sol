// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// ============ Imports ============

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";


/// @title Decentralized Creator Nonfungible Token Vault Wrapper (DCNT VWs)
/// @notice claimable ERC20s for NFT holders after vault expiration
contract DCNTVaultWrapper is Ownable, Initializable {

  /// ============ Immutable storage ============

  /// ============ Mutable storage ============

  /// @notice vault token to be distributed to token holders
  IERC20 public vaultDistributionToken;
  /// @notice "ticket" token held by user
  IERC721Enumerable public nftVaultKey;
  /// @notice unlock date when distribution can start happening
  uint256 public unlockDate;

  /// @notice merkleRoot snapshot of NFT ownership for ERC20 claiming
  bytes32 public merkleRoot;

  /// @notice Mapping of addresses who have claimed tokens
  mapping(address => bool) internal hasClaimed;

  /// @notice total # of tokens already released
  uint256 private _totalReleased;

  /// ============ Events ============

  /// @notice Emitted after a successful token claim
  /// @param account recipient of claim
  /// @param amount of tokens claimed
  event Claimed(address account, uint256 amount);

  /// ============ Initializer ============

  /// @notice Initializes a new vault
  /// @param _vaultDistributionTokenAddress of token
  /// @param _nftVaultKeyAddress of token
  /// @param _unlockDate date of vault expiration
  function initialize(
    address _owner,
    address _vaultDistributionTokenAddress,
    address _nftVaultKeyAddress,
    uint256 _unlockDate
  ) public initializer {
    _transferOwnership(_owner);
    vaultDistributionToken = IERC20(_vaultDistributionTokenAddress);
    nftVaultKey = IERC721Enumerable(_nftVaultKeyAddress);
    unlockDate = _unlockDate;
  }

  /// ============ Functions ============

  // returns balance of vault
  function vaultBalance() public view returns (uint256) {
    return vaultDistributionToken.balanceOf(address(this));
  }

  // returns total # of tokens already released from vault
  function totalReleased() public view returns (uint256) {
    return _totalReleased;
  }

  // set a merkle root to allow nft holders to claim tokens
  function unlockVault(bytes32 _merkleRoot) public onlyOwner {
    require(block.timestamp >= unlockDate, 'vault is still locked');
    merkleRoot = _merkleRoot;
  }

  // (total vault balance) * (nfts_owned/total_nfts)
  function _pendingPayment(uint256 numNftVaultKeys, uint256 totalReceived) private view returns (uint256) {
    return (totalReceived * numNftVaultKeys) / nftVaultKey.totalSupply();
  }

  // claim a share of tokens and verify token allocation using merkle proof
  function claim(address to, uint256 tokensToClaim, bytes32[] calldata proof) external {
    require(block.timestamp >= unlockDate, 'vault is still locked');
    require(vaultBalance() > 0, 'vault is empty');
    require(merkleRoot != '', 'merkle root not yet set');
    require(_verify(_leaf(to, tokensToClaim), proof), "merkle proof is invalid");

    require(hasClaimed[to] == false, 'token already claimed');
    hasClaimed[to] = true;

    uint256 amount = _pendingPayment(tokensToClaim, vaultBalance() + totalReleased());
    require(amount > 0, 'address has no claimable tokens');
    require(vaultDistributionToken.transfer(to, amount), 'Transfer failed');

    _totalReleased += amount;
    emit Claimed(to, amount);
  }

  // verify a merkle proof
  function _verify(bytes32 leaf, bytes32[] memory proof) internal view returns (bool) {
    return MerkleProof.verify(proof, merkleRoot, leaf);
  }

  // generate a leaf node
  function _leaf(address to, uint256 tokensToClaim) internal pure returns (bytes32) {
    return keccak256(abi.encodePacked(to, tokensToClaim));
  }

  // allows vault owner to claim ERC20 tokens sent to account
  // failsafe in case money needs to be taken off chain
  function drain(IERC20 token) public onlyOwner {
    token.transfer(msg.sender, token.balanceOf(address(this)));
  }
  
  function drainEth() public onlyOwner {
    payable(msg.sender).transfer(address(this).balance);
  }
}
