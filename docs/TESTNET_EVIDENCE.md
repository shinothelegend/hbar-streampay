# StreamPay Testnet Evidence

This document contains the required on-chain evidence for the Scaffold-HBAR Bounty submission. 
All links point to Hashscan on the Hedera Testnet.

## 1. Smart Contract Deployment
- **Contract Name:** `PayrollVault.sol`
- **Hashscan Link:** `[PENDING_DEPLOY]`

## 2. Seed Transaction (Funding a Plan)
- **Action:** Employer approves and funds the `PayrollVault` with USDC.
- **Hashscan Link (Approve):** `[PENDING_APPROVE]`
- **Hashscan Link (Fund):** `[PENDING_FUND]`

## 3. Claim (Stablecoin USDC)
- **Action:** Employee claims accrued salary natively in USDC.
- **Hashscan Link:** `[PENDING_CLAIM_USDC]`

## 4. Claim (Auto-converted to HBAR via SaucerSwap)
- **Action:** Employee claims accrued salary, and the Vault swaps it to HBAR via SaucerSwap V1 Router.
- **Hashscan Link:** `[PENDING_CLAIM_HBAR]`

## 5. HCS Audit Trail Receipt
- **Topic ID:** `[PENDING_TOPIC_ID]`
- **Action:** Next.js backend submits the claim receipt to the HCS topic.
- **Hashscan Link (Topic Message):** `[PENDING_HCS_MESSAGE]`
