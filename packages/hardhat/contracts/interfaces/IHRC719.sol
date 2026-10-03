// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

interface IHRC719 {
    function associate() external returns (uint256 responseCode);
    function dissociate() external returns (uint256 responseCode);
}
