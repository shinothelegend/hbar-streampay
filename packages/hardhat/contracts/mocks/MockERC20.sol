// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0;

import "../interfaces/IERC20Minimal.sol";

contract MockERC20 is IERC20Minimal {
    string public name = "Mock Token";
    string public symbol = "MOCK";
    uint8 public decimals = 6;
    uint256 public totalSupply = 1000000 * 1e6;

    mapping(address => uint256) public balances;
    mapping(address => mapping(address => uint256)) public allowances;

    constructor() {
        balances[msg.sender] = totalSupply;
    }

    function transferFrom(address sender, address recipient, uint256 amount) external override returns (bool) {
        require(balances[sender] >= amount, "ERC20: transfer amount exceeds balance");
        require(allowances[sender][msg.sender] >= amount, "ERC20: transfer amount exceeds allowance");
        
        balances[sender] -= amount;
        balances[recipient] += amount;
        allowances[sender][msg.sender] -= amount;
        return true;
    }

    function transfer(address recipient, uint256 amount) external override returns (bool) {
        require(balances[msg.sender] >= amount, "ERC20: transfer amount exceeds balance");
        balances[msg.sender] -= amount;
        balances[recipient] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external override returns (bool) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function balanceOf(address account) external view override returns (uint256) {
        return balances[account];
    }
}
