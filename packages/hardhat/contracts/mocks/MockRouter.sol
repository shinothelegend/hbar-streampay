// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/ISaucerSwapV1Router.sol";
import "../interfaces/IERC20Minimal.sol";

contract MockRouter is ISaucerSwapV1Router {
    function getAmountsOut(
        uint256 amountIn,
        address[] calldata path
    ) external pure override returns (uint256[] memory amounts) {
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        // Mock 1:1 conversion for simplicity
        amounts[1] = amountIn;
    }

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external override returns (uint256[] memory amounts) {
        require(block.timestamp <= deadline, "MockRouter: expired deadline");
        require(amountIn >= amountOutMin, "MockRouter: insufficient output amount");

        // Take tokens from sender
        IERC20Minimal(path[0]).transferFrom(msg.sender, address(this), amountIn);
        
        // We simulate ETH/HBAR transfer
        // Note: MockRouter must be funded with native currency before this test
        (bool success, ) = to.call{value: amountIn}("");
        require(success, "MockRouter: ETH transfer failed");

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[1] = amountIn;
        return amounts;
    }

    // to receive mock ETH/HBAR
    receive() external payable {}
}
