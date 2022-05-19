// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// ============ Imports ============

import "./DCNTVaultWrapper.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

/// @title a minimal proxy clone factory for deploying DCNT VW's
/// @notice provides a gas-efficient way to create DCNT VW's
contract DCNTVWFactory is Ownable {

  /// ============ Immutable storage ============

  /// @notice implementation address for base vault contract
  address public vaultImplementation;

  /// ============ Mutable storage ============

  /// @notice Array of vaults launched by the vault factory
  address[] public allVaults;

  /// ============ Events ============

  /// @notice Emitted after successfully creating a new vault
  /// @param vault address of the newly created vault
  event NewVault(address vault);

  /// ============ Constructor ============

  /// @notice Creates a new vault factory
  /// @param _vaultImplementation address for base vault contract
  constructor(address _vaultImplementation) {
    vaultImplementation = _vaultImplementation;
  }

  /// ============ Functions ============

  // deploy and initialize a vault wrapper clone
  function deployVault(
    address _vaultDistributionTokenAddress,
    address _nftVaultKeyAddress,
    uint256 _unlockDate
  ) external payable {
    address vaultInstance = Clones.clone(vaultImplementation);
    (bool success, ) = vaultInstance.call{value: msg.value}(
      abi.encodeWithSignature("initialize(address,address,address,uint256)",
        msg.sender,
        _vaultDistributionTokenAddress,
        _nftVaultKeyAddress,
        _unlockDate
      )
    );
    require(success);
    allVaults.push(vaultInstance);
    emit NewVault(vaultInstance);
  }
}
