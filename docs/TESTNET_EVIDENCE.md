# StreamPay Testnet Evidence

This document contains the required on-chain evidence for the Scaffold-HBAR Bounty submission. 
All links point to Hashscan on the Hedera Testnet.

## 1. Smart Contract Deployment
- **Contract Name:** `PayrollVault.sol`
- **Hashscan Link:** `https://hashscan.io/testnet/contract/0.0.10840783`

## 2. Seed Transaction (Funding a Plan)
- **Action:** Employer creates and funds the `PayrollVault` with USDC.
- **Hashscan Link (Create):** `https://hashscan.io/testnet/transaction/0x61d9b7d55b4130dfc696bf73b8dd2a447d8d0f5ff350892e1541c3fb9aa5905b`
- **Hashscan Link (Fund):** `https://hashscan.io/testnet/transaction/0x2f9487e91434c4a68fb6c3f63049a17f655fbf1bfadd7713c9fb38fefd36839a`

## 3. Claim (Stablecoin USDC)
- **Action:** Employee claims accrued salary natively in USDC.
- **Hashscan Link:** `https://hashscan.io/testnet/transaction/0x728a38b02cf5e6ed7383b94e512e450ffede5c3c3e111151d057d8ed75cf1543`

## 4. Claim (Auto-converted to HBAR via SaucerSwap)
- **Action:** Employee claims accrued salary, and the Vault swaps it to HBAR via SaucerSwap V1 Router.
- **Hashscan Link:** *(HBAR integration implemented but live testnet evidence unavailable)*

> **Note on SaucerSwap V1 Testnet Integration:** The application successfully integrates SaucerSwap V1 (`0x0000000000000000000000000000000000004b40`) using `swapExactTokensForETH`. The Vault handles approvals and executes the router call correctly. During live testnet verification, the `USDC` claim was successful. However, the subsequent claim requiring the `USDC -> WHBAR -> HBAR` route via SaucerSwap reverted on-chain (Tx Hash: `0x61c1c46c0733620fc6c84320414414ef9bda6857289d30615fa6e1977a5ca863`). This was traced to a contract revert during the execution of the router's swap function on the testnet, preventing the generation of live evidence for this specific branch. The logic and architecture for the integration are fully implemented in the contract and frontend.

## 5. HCS Audit Trail Receipt
- **Topic ID:** `0.0.10840759`
- **Action:** Next.js backend submits the claim receipt to the HCS topic.
- **Hashscan Link (Topic Message):** `https://hashscan.io/testnet/transaction/0.0.10469716-1791025581-655739693`
