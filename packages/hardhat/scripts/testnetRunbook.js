const { ethers } = require("ethers");
const { Client, PrivateKey, TokenAssociateTransaction } = require("@hashgraph/sdk");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

async function associate(accountId, keyStr, tokens) {
  const client = Client.forTestnet();
  const key = keyStr.startsWith("30") ? PrivateKey.fromString(keyStr) : PrivateKey.fromStringECDSA(keyStr);
  client.setOperator(accountId, key);
  
  try {
    const tx = await new TokenAssociateTransaction()
      .setAccountId(accountId)
      .setTokenIds(tokens)
      .execute(client);
    await tx.getReceipt(client);
    console.log(`Associated tokens for ${accountId}`);
  } catch (e) {
    if (e.message.includes("TOKEN_ALREADY_ASSOCIATED")) {
      console.log(`Tokens already associated for ${accountId}`);
    } else {
      console.error("Associate error:", e.message);
    }
  }
}

async function main() {
  const provider = new ethers.JsonRpcProvider("https://testnet.hashio.io/api");
  const employerWallet = new ethers.Wallet("0x45f69fc3cfc5f6cbb382507a0c37ea161f95db95a63f008245eb94c2c2e6aa92", provider);
  
  // Create Employee A
  const empAWallet = ethers.Wallet.createRandom().connect(provider);
  // Create Employee B
  const empBWallet = ethers.Wallet.createRandom().connect(provider);

  console.log("Employer Address:", employerWallet.address);
  console.log("Employee A Address:", empAWallet.address);
  console.log("Employee B Address:", empBWallet.address);

  const USDC = "0x0000000000000000000000000000000000001549"; // 0.0.5449
  const USDC_HEDERA_ID = "0.0.5449";
  const WHBAR = "0x0000000000000000000000000000000000003ad2"; // 0.0.15058
  const WHBAR_HEDERA_ID = "0.0.15058";
  
  const artifactPath = path.join(__dirname, "../deployments/hederaTestnet/PayrollVault.json");
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  const vault = new ethers.Contract(artifact.address, artifact.abi, employerWallet);

  // Associate Vault using ethers (associateToken method)
  console.log("Associating vault with USDC...");
  try {
    const tx0 = await vault.associateToken(USDC);
    await tx0.wait();
  } catch (e) { console.log("Vault associate error or already associated"); }
  
  try {
    const tx1 = await vault.associateToken(WHBAR);
    await tx1.wait();
  } catch (e) { console.log("Vault associate WHBAR error or already associated"); }

  // We need USDC to fund the plan. 
  // Let's buy USDC on SaucerSwap.
  const routerAbi = [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)"
  ];
  const router = new ethers.Contract("0x0000000000000000000000000000000000004b40", routerAbi, employerWallet);
  
  console.log("Buying 10 USDC from SaucerSwap...");
  const deadline = Math.floor(Date.now() / 1000) + 600;
  try {
    const txBuy = await router.swapExactETHForTokens(
      0, 
      [WHBAR, USDC], 
      employerWallet.address, 
      deadline,
      { value: ethers.parseEther("2") } // Spend 2 HBAR
    );
    console.log(`Bought USDC! Tx: https://hashscan.io/testnet/transaction/${txBuy.hash}`);
    await txBuy.wait();
  } catch (e) {
    console.error("Buy USDC Failed", e);
    // Continue anyway
  }

  const usdcAbi = ["function approve(address spender, uint256 amount) external returns (bool)", "function balanceOf(address account) external view returns (uint256)"];
  const usdcContract = new ethers.Contract(USDC, usdcAbi, employerWallet);

  const balance = await usdcContract.balanceOf(employerWallet.address);
  console.log(`USDC Balance: ${balance}`);
  
  if (balance > 0) {
    console.log("Approving vault...");
    const txApprove = await usdcContract.approve(artifact.address, balance);
    console.log(`Approve Tx: https://hashscan.io/testnet/transaction/${txApprove.hash}`);
    await txApprove.wait();

    console.log("Creating Plan A...");
    const rate = balance / 2n; // Give half to A, half to B
    const txPlanA = await vault.createPlan(empAWallet.address, USDC, rate / 600n, 600n);
    console.log(`Create Plan A Tx: https://hashscan.io/testnet/transaction/${txPlanA.hash}`);
    const receiptA = await txPlanA.wait();
    const planIdA = receiptA.logs[0].args[0];

    console.log("Funding Plan A...");
    const txFundA = await vault.fundPlan(planIdA, rate);
    console.log(`Fund Plan A Tx: https://hashscan.io/testnet/transaction/${txFundA.hash}`);
    await txFundA.wait();
    
    console.log("Waiting 10 seconds for accrual...");
    await new Promise(r => setTimeout(r, 10000));

    console.log("Employee A Claiming...");
    const vaultEmpA = vault.connect(empAWallet);
    // Note: Emp A has 0 HBAR for gas. We must send gas.
    await employerWallet.sendTransaction({ to: empAWallet.address, value: ethers.parseEther("2") }).then(tx => tx.wait());
    
    // We also need to associate USDC to EmpA before they can receive USDC!
    // But since it's an ethers wallet, it has no `0.0.x` account ID unless we use the mirror node to find it,
    // OR we just execute associate via Hedera SDK. Wait, ethers wallets on testnet are hollow accounts.
    // A hollow account MUST be associated with the token to receive it! Wait, EIP-2930 / Hedera auto-association
    // might kick in if the vault sends them USDC and they have open auto-association slots. Hollow accounts get 1 auto-association slot by default.
    // Let's rely on auto-association.
    
    const txClaimA = await vaultEmpA.claim(planIdA, false, 0);
    console.log(`Employee A Claim Tx: https://hashscan.io/testnet/transaction/${txClaimA.hash}`);
    await txClaimA.wait();

    // Do Plan B with swap to HBAR! (Swap to HBAR does NOT require token association for the employee because they get native HBAR!)
    console.log("Creating Plan B...");
    const txPlanB = await vault.createPlan(empBWallet.address, USDC, rate / 600n, 600n);
    const receiptB = await txPlanB.wait();
    const planIdB = receiptB.logs[0].args[0];
    await vault.fundPlan(planIdB, rate).then(tx => tx.wait());
    
    await employerWallet.sendTransaction({ to: empBWallet.address, value: ethers.parseEther("2") }).then(tx => tx.wait());

    console.log("Employee B Claiming with swap...");
    const vaultEmpB = vault.connect(empBWallet);
    const txClaimB = await vaultEmpB.claim(planIdB, true, 0);
    console.log(`Employee B Swap Claim Tx: https://hashscan.io/testnet/transaction/${txClaimB.hash}`);
    await txClaimB.wait();

    console.log("All done!");
  } else {
    console.log("Could not get USDC. Aborting runs.");
  }
}

main().catch(console.error);
