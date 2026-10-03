import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { HEDERA_TESTNET } from "../config/hedera-testnet";

async function getEvmAddress(hederaId: string): Promise<string> {
  const url = `https://testnet.mirrornode.hedera.com/api/v1/contracts/${hederaId}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch EVM address for ${hederaId}`);
  }
  const data = await response.json();
  return data.evm_address;
}

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const [deployer] = await ethers.getSigners();
  
  if (hre.network.name !== "testnet") {
    console.log("Skipping seed demo on non-testnet network");
    return;
  }

  console.log("--- SEEDING DEMO ACCOUNTS ---");
  const employerWallet = ethers.Wallet.createRandom().connect(ethers.provider);
  const employeeWallet = ethers.Wallet.createRandom().connect(ethers.provider);

  console.log("Employer Address:", employerWallet.address);
  console.log("Employer PK:", employerWallet.privateKey);
  console.log("Employee Address:", employeeWallet.address);
  console.log("Employee PK:", employeeWallet.privateKey);

  // Transfer HBAR to implicitly create accounts on Hedera testnet
  console.log("Funding accounts with HBAR...");
  await (await deployer.sendTransaction({ to: employerWallet.address, value: ethers.parseEther("100") })).wait();
  await (await deployer.sendTransaction({ to: employeeWallet.address, value: ethers.parseEther("100") })).wait();

  // Get EVM addresses for USDC and WHBAR
  const usdcEvm = await getEvmAddress(HEDERA_TESTNET.usdc.hederaId);
  const whbarEvm = await getEvmAddress(HEDERA_TESTNET.whbarToken.hederaId);

  // Associate USDC and WHBAR via HIP-719 fallback
  console.log("Associating HTS tokens for employer...");
  await (await employerWallet.sendTransaction({ to: usdcEvm, data: "0x1b9265b8" /* associate() */, gasLimit: 1000000 })).wait();
  await (await employerWallet.sendTransaction({ to: whbarEvm, data: "0x1b9265b8", gasLimit: 1000000 })).wait();

  console.log("Associating HTS tokens for employee...");
  await (await employeeWallet.sendTransaction({ to: usdcEvm, data: "0x1b9265b8", gasLimit: 1000000 })).wait();
  await (await employeeWallet.sendTransaction({ to: whbarEvm, data: "0x1b9265b8", gasLimit: 1000000 })).wait();

  console.log("Demo seed complete!");
};

export default func;
func.tags = ["SeedDemo"];
func.dependencies = ["PayrollVault"];
