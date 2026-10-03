# StreamPay Testnet Evidence

This document contains the required on-chain evidence for the Scaffold-HBAR Bounty submission. 
All links point to Hashscan on the Hedera Testnet.

## 1. Smart Contract Deployment
- **Contract Name:** `PayrollVault.sol`
- **Hashscan Link:** `https://hashscan.io/testnet/contract/0.0.10840783`

## 2. Seed Transaction (Funding a Plan)
- **Action:** Employer approves and funds the `PayrollVault` with USDC.
- **Hashscan Link (Approve):** `https://hashscan.io/testnet/transaction/0x267644233d45d38910265b0c205e1abee6b0273f02020d3c0de79e47f868cb13`
- **Hashscan Link (Fund):** `https://hashscan.io/testnet/transaction/0x722cc08050bd641bf754306f83d3f948208ebb634ee588c9d057af52e5da58be`

## 3. Claim (Stablecoin USDC)
- **Action:** Employee claims accrued salary natively in USDC.
- **Hashscan Link:** `https://hashscan.io/testnet/transaction/0x5db5f99d17208424b7d7b7f9b97311ee7a5bed85b6fffd7a99207b57a64d7858`

## 4. Claim (Auto-converted to HBAR via SaucerSwap)
- **Action:** Employee claims accrued salary, and the Vault swaps it to HBAR via SaucerSwap V1 Router.
- **Hashscan Link:** *(User will execute via UI testing)*

## 5. HCS Audit Trail Receipt
- **Topic ID:** `0.0.10840759`
- **Action:** Next.js backend submits the claim receipt to the HCS topic.
- **Hashscan Link (Topic Message):** *(User will execute via UI testing)*
